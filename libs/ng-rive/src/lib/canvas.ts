import { Directive, ElementRef, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { Observable, Subscription, of, merge } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import type { RivePlayer } from './player';
import { RiveService } from './service';
import { Artboard, CanvasRenderer, LinearAnimationInstance, RiveCanvas, File } from './types';

// Observable that trigger on every frame
const animationFrame = new Observable<number>((subject) => {
  let start = 0;
  const run = (time: number) => {
    const delta = time - start;
    start = time;
    subject.next(delta);
    requestAnimationFrame(run)
  }
  requestAnimationFrame(run);
});

// Observable that trigger once when element is visible
const onVisible = (element: HTMLElement) => new Observable<boolean>((subscriber) => {
  if (!('IntersectionObserver' in window)) return subscriber.next(true);
  let isVisible = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const visible = entry.intersectionRatio > 0.1;
        if (visible !== isVisible) {
          isVisible = !isVisible;
          subscriber.next(isVisible);
        }
      }
    });
  }, { threshold: [0, 0.1] });
  // start observing element visibility
  observer.observe(element);
})

function exist<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}


function frameToSec(frameIndex: number, fps: number) {
  return frameIndex / fps;
}

@Directive({
  selector: 'canvas[riv]',
  exportAs: 'rivCanvas'
})
export class RiveCanvasDirective {
  private subs: Subscription[] = [];
  private loaded?: Promise<boolean>;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer?: CanvasRenderer;
  private rive?: RiveCanvas;
  private file?: File; 
  public artboard?: Artboard;

  private animations: Record<string, LinearAnimationInstance> = {};

  public isVisible: Observable<boolean>;

  @Input('riv') url!: string;
  @Input('artboard') artboardName?: string;
    
  @Input() lazy: boolean | '' = false;


  @Output() played = new EventEmitter<string>();
  @Output() paused = new EventEmitter<string>();

  constructor(
    private zone: NgZone,
    private service: RiveService,
    element: ElementRef<HTMLCanvasElement>
  ) {
    this.canvas = element.nativeElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not find context of canvas');
    this.ctx = ctx;
    this.isVisible = onVisible(this.canvas).pipe(
      shareReplay(1),
      tap(console.log),
    );
  }

  get isLazy() {
    return this.lazy === true || this.lazy === '';
  }

  ngOnInit() {
    if (!this.isLazy) this.load();
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  private load() {
    if (!this.loaded) {
      this.loaded = new Promise(async (res, rej) => {
        this.file = await this.service.load(this.url);
        this.rive = this.service.rive;
        if (!this.rive) throw new Error('Service could not load rive');

        this.renderer = new this.rive.CanvasRenderer(this.ctx);
        this.artboard = this.artboardName
          ? this.file.artboard(this.artboardName)
          : this.file.defaultArtboard();
        res(true);
      });
    }
    return this.loaded;
  }

  private getAnimation(name: string) {
    if (!this.animations[name]) {
      if (!this.rive) throw new Error('Load rive before loading animation');
      if (!this.artboard) throw new Error('Load artboard before loading animation');
      const anim = this.artboard.animation(name);
      this.animations[name] = new this.rive.LinearAnimationInstance(anim);
      // Looks like the first time value is the start in frame (instead of sec)
      this.animations[name].time = frameToSec(this.animations[name].time, anim.fps);
    }
    return this.animations[name];
  }


  async register(animation: string, player: RivePlayer) {

    let anim: LinearAnimationInstance;

    // Apply changes on the canvas
    const applyChange = (delta: number) => {
      if (!this.rive) throw new Error('Could not load rive before registrating animation');
      if (!this.artboard) throw new Error('Could not load artboard before registrating animation');
      if (!this.renderer) throw new Error('Could not load renderer before registrating animation');
      // Move frame
      anim.advance(delta);
      anim.apply(this.artboard, player.state.getValue().mix);
      this.artboard.advance(delta);
      this.zone.run(() => player.timeChange.next(anim.time));

      // Render frame on canvas
      const frame = { minX: 0, minY: 0, maxX: this.canvas.width, maxY: this.canvas.height };
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.renderer.align(this.rive.Fit.contain, this.rive.Alignment.center, frame, this.artboard.bounds);
      this.artboard.draw(this.renderer);
      this.ctx.restore();
    }

    // Trigger change when player time has been manually changed
    const onTimeChange = player.distance.pipe(
      filter(exist),
      filter(time => time !== anim.time),
      distinctUntilChanged(),
      map(time => time - anim.time)
    );
    
    // Trigger change on every frame if player is playing
    let lastTime: number;
    const onFrameChange = player.state.pipe(
      switchMap((state) => {
        if (state.playing) {
          return animationFrame.pipe(map((time) => [state, time] as const));
        } else {
          return of(null)
        }
      }),
      filter(exist),
      map(([ state, time ]) => {
        const { direction, speed, autoreset, mode, start, end } = state;
        let delta = (time / 1000) * speed * direction;
        
        // When player hit floor
        if (anim.time + delta < start) {
          if (mode === 'loop' && direction === -1 && end) {
            delta = end;
          } else if (mode === 'ping-pong') {
            lastTime = anim.time + delta;
            player.update({ direction: 1 });
            this.zone.run(() => player.revertChange.emit(false));
          } else if (mode === 'one-shot') {
            player.update({ playing: false });
            this.zone.run(() => player.playChange.emit(false));
            if (autoreset && end) delta = end - anim.time;
          }
        }

        // When player hit last frame (workaround awaiting for new version with workEnd)
        const workEnded = (end && anim.time + delta > end) || (!end && anim.time === lastTime);
        if (workEnded) {
          if (mode === 'loop' && direction === 1) {
            delta = start - anim.time;
          } else if (mode === 'ping-pong') {
            lastTime = anim.time + delta;
            player.update({ direction: -1 });
            this.zone.run(() => player.revertChange.emit(true));
          } else if (mode === 'one-shot') {
            player.update({ playing: false });
            this.zone.run(() => player.playChange.emit(false));
            if (autoreset) delta = start - anim.time;
          }
        }
        lastTime = anim.time;
        return delta;
      })
    );

    // Wait for the canvas to be visible
    const onReady = this.isLazy
      ? this.isVisible.pipe(filter(visible => !!visible), take(1))
      : of(true);

    const sub = onReady.pipe(
      switchMap(() => this.load()),
      tap(() => anim = this.getAnimation(animation)),
      switchMap(() => merge(onTimeChange, onFrameChange)),
    ).subscribe(applyChange);

    this.subs.push(sub);
  }

}

