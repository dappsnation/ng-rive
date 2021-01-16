import { Directive, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import type { RivePlayer } from './player';
import { RiveService } from './service';
import { Artboard, CanvasRenderer, LinearAnimationInstance, RiveCanvas, File } from './types';

const animationFrame = new Observable<number>((observer) => {
  let start = 0;
  const run = (time: number) => {
    const delta = time - start;
    start = time;
    observer.next(delta);
    requestAnimationFrame(run)
  }
  requestAnimationFrame(run);
});

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

  @Input('riv') url!: string;
  @Input('artboard') artboardName?: string;

  @Output() played = new EventEmitter<string>();
  @Output() paused = new EventEmitter<string>();

  constructor(
    private service: RiveService,
    element: ElementRef<HTMLCanvasElement>
  ) {
    this.canvas = element.nativeElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not find context of canvas');
    this.ctx = ctx;
  }

  ngOnInit() {
    this.load();
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
      console.log(name, this.animations[name].time);
    }
    return this.animations[name];
  }


  async register(animation: string, player: RivePlayer) {
    await this.load();

    const anim = this.getAnimation(animation);

    // Apply changes on the canvas
    const applyChange = (delta: number) => {
      if (!this.rive) throw new Error('Could not load rive before registrating animation');
      if (!this.artboard) throw new Error('Could not load artboard before registrating animation');
      if (!this.renderer) throw new Error('Could not load renderer before registrating animation');
      // Move frame
      anim.advance(delta);
      anim.apply(this.artboard, player.state.getValue().mix);
      this.artboard.advance(delta);
      player.timeChange.next(anim.time);

      // Render frame on canvas
      const frame = { minX: 0, minY: 0, maxX: this.canvas.width, maxY: this.canvas.height };
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.renderer.align(this.rive.Fit.contain, this.rive.Alignment.center, frame, this.artboard.bounds);
      this.artboard.draw(this.renderer);
      this.ctx.restore();
    }

    const onTimeChange = player.distance.pipe(
      filter(exist),
      distinctUntilChanged()
    ).subscribe(time => {
      const delta = time - anim.time;
      applyChange(delta);
    });
    this.subs.push(onTimeChange);
    
    let lastTime: number;
    const onFrameChange = combineLatest([ animationFrame, player.state ]).pipe(
      filter(([ time, state ]) => state.playing)
    ).subscribe(([ time, state ]) => {
      const { direction, speed, autoreset, mode, start, end } = state;
      let delta = (time / 1000) * speed * direction;
      
      // When player hit floor
      if (anim.time + delta < start) {
        if (mode === 'loop' && direction === -1 && end) {
          delta = end;
        } else if (mode === 'ping-pong') {
          lastTime = anim.time + delta;
          player.update({ direction: 1 });
          player.revertChange.emit(false);
        } else if (mode === 'one-shot') {
          player.update({ playing: false });
          player.playChange.emit(false);
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
          player.revertChange.emit(true);
        } else if (mode === 'one-shot') {
          player.update({ playing: false });
          player.playChange.emit(false);
          if (autoreset) delta = start - anim.time;
        }
      }
      lastTime = anim.time;

      applyChange(delta);

    });
    this.subs.push(onFrameChange);
  }

}

