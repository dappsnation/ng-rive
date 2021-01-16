import { Directive, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { RiveService } from './service';
import { Artboard, CanvasRenderer, LinearAnimationInstance, RiveCanvas, File } from 'rive-canvas';

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

interface RivePlayerState {
  speed: number;
  direction: 1 | -1;
  playing: boolean;
  mix: number;
  /** Reset automatically to 0 when play is down if mode is "one-shot" */
  autoreset: boolean;
  mode: 'loop' | 'ping-pong' | 'one-shot';
  /** Work Start */
  start: number;
  /** Work End */
  end?: number;
}

function getRivePlayerState(state: Partial<RivePlayerState> = {}): RivePlayerState {
  return {
    speed: 1,
    direction: 1,
    playing: false,
    mix: 1,
    mode: 'one-shot',
    autoreset: false,
    start: 0,
    ...state
  }
}

@Directive({
  selector: 'riv-player, [rivPlayer]',
  exportAs: 'rivPlayer'
})
export class RivePlayer {
  distance = new BehaviorSubject<number | null>(null);
  state = new BehaviorSubject<RivePlayerState>(getRivePlayerState());

  @Input() set name(name: string) {
    // TODO: unregister old name if any
    this.rive.register(name, this);
  }
  @Input() set mix(value: number | string) {
    const mix = typeof value === 'string' ? parseFloat(value) : value; 
    if (mix >= 0 && mix <= 1) this.update({ mix });
  }
  @Input() set mode(mode: RivePlayerState['mode']) {
    if (mode) this.update({ mode });
  }
  // NUMBERS
  @Input() set speed(value: number | string) {
    const speed = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof speed === 'number') this.update({ speed });
  }
  @Input() set start(value: number | string) {
    const start = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof start === 'number') this.update({ start });
  }
  @Input() set end(value: number | string) {
    const end = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof end === 'number') this.update({ end });
  }
  // STRING
  @Input() set revert(revert: boolean | '') {
    if (revert === true || revert === '') {
      this.update({ direction: -1 });
    } else if (revert === false) {
      this.update({ direction: 1 });
    }
  }
  @Input() set play(playing: boolean | '') {
    if (playing === true || playing === '') {
      this.update({ playing: true });
    } else if (playing === false) {
      this.update({ playing: false });
    }
  }
  @Input() set autoreset(autoreset: boolean | '') {
    if (autoreset === true || autoreset === '') {
      this.update({ autoreset: true });
    } else if (autoreset === false) {
      this.update({ autoreset: false });
    }
  }
  @Input() set time(value: number | string) {
    const time = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof time === 'number') this.distance.next(time);
  }
  



  @Output() timeChange = new EventEmitter<number>();
  @Output() playChange = new EventEmitter<boolean>();
  @Output() revertChange = new EventEmitter<boolean>();

  constructor(private rive: RiveDirective) {}

  update(state: Partial<RivePlayerState>) {
    const next = getRivePlayerState({...this.state.getValue(), ...state })
    this.state.next(next);
  }
}

function frameToSec(frameIndex: number, fps: number) {
  return frameIndex / fps;
}

@Directive({
  selector: 'canvas[riv]'
})
export class RiveDirective {
  private subs: Subscription[] = [];
  private loaded: Promise<boolean>;
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
    this.ctx = this.canvas.getContext('2d');
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
      const anim = this.artboard.animation(name);
      this.animations[name] = new this.rive.LinearAnimationInstance(anim);
      // Looks like the first time value is the start in frame (instead of sec)
      this.animations[name].time = frameToSec(this.animations[name].time, anim.fps);
    }
    return this.animations[name];
  }


  async register(animation: string, player: RivePlayer) {
    await this.load();
    const anim = this.getAnimation(animation);

    // Apply changes on the canvas
    const applyChange = (delta: number) => {
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
      filter(time => !!time),
      distinctUntilChanged()
    ).subscribe(time => {
      const delta = time - anim.time;
      applyChange(delta);
    });
    this.subs.push(onTimeChange);
    
    let lastTime;
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

