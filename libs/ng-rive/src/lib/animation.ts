import { Directive, EventEmitter, Input, NgZone, Output } from "@angular/core";
import { BehaviorSubject, of, Subscription } from "rxjs";
import { filter, map, switchMap } from "rxjs/operators";
import { RiveCanvasDirective } from './canvas';
import { RiveService } from "./service";
import { LinearAnimation, LinearAnimationInstance } from "rive-canvas";

interface RiveAnimationState {
  speed: number;
  playing: boolean;
  /** Weight of this animation over another */
  mix: number;
  /** Reset automatically to 0 when play is down if mode is "one-shot" */
  autoreset: boolean;
  /** override mode of the animation */
  mode?: 'loop' | 'ping-pong' | 'one-shot';
}

function getRiveAnimationState(state: Partial<RiveAnimationState> = {}): RiveAnimationState {
  return {
    speed: 1,
    playing: false,
    mix: 1,
    autoreset: false,
    ...state
  }
}


function round(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function exist<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}

@Directive({
  selector: 'riv-animation, [rivAnimation]',
  exportAs: 'rivAnimation'
})
export class RiveAnimationDirective {
  private sub?: Subscription;
  distance = new BehaviorSubject<number | null>(null);
  state = new BehaviorSubject<RiveAnimationState>(getRiveAnimationState());

  @Input()
  set name(name: string | undefined | null) {
    if (typeof name !== 'string') return;
    this.zone.runOutsideAngular(() => {
      this.register(name);
    });
  }

  @Input()
  set index(value: number | string | undefined | null) {
    const index = typeof value === 'string' ? parseInt(value) : value;
    if (typeof index !== 'number') return;
    this.zone.runOutsideAngular(() => {
      this.register(index);
    });
  }

  @Input()
  set mix(value: number | string | undefined | null) {
    const mix = typeof value === 'string' ? parseFloat(value) : value; 
    if (mix && mix >= 0 && mix <= 1) this.update({ mix });
  }
  get mix() {
    return this.state.getValue().mix;
  }


  // NUMBERS
  @Input()
  set speed(value: number | string | undefined | null) {
    const speed = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof speed === 'number') this.update({ speed });
  }
  get speed() {
    return this.state.getValue().speed;
  }

  @Input() set play(playing: boolean | '' | undefined | null) {
    if (playing === true || playing === '') {
      this.update({ playing: true });
    } else if (playing === false) {
      this.update({ playing: false });
    }
  }
  get play() {
    return this.state.getValue().playing;
  }

  
  @Output() playChange = new EventEmitter<boolean>();
  @Output() speedChange = new EventEmitter<number>();
  @Output() load = new EventEmitter<LinearAnimation>();

  private animation?: LinearAnimation;
  private animationInstance?: LinearAnimationInstance;

  constructor(
    private zone: NgZone,
    private canvas: RiveCanvasDirective,
    private service: RiveService,
  ) {}

  
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private update(state: Partial<RiveAnimationState>) {
    const next = getRiveAnimationState({...this.state.getValue(), ...state })
    this.state.next(next);
  }

  private initAnimation(name: string | number) {
    if (!this.canvas.rive) throw new Error('Could not load animation instance before rive');
    if (!this.canvas.artboard) throw new Error('Could not load animation instance before artboard');
    this.animation = typeof name === 'string'
      ? this.canvas.artboard.animationByName(name)
      : this.canvas.artboard.animationByIndex(name);

    this.animationInstance = new this.canvas.rive.LinearAnimationInstance(this.animation);
    this.load.emit(this.animation);
  }

  private getTime() {
    if (!this.animationInstance) throw new Error('Could not load animation instance before running it');
    return this.animationInstance.time;
  }


  private getFrame(state: RiveAnimationState) {
    if (state.playing) {
      return this.service.frame.pipe(map((time) => [state, time] as const));
    } else {
      return of(null)
    }
  }

  private register(name: string | number) {
    // Stop subscribing to previous animation if any
    this.sub?.unsubscribe(); 

    // Update on frame change if playing
    const onFrameChange = this.state.pipe(
      switchMap((state) => this.getFrame(state)),
      filter(exist),
      map(([state, time]) => this.moveFrame(state, time))
    );

    // Wait for canvas & animation to be loaded
    this.sub = this.canvas.onReady().pipe(
      map(() => this.initAnimation(name)),
      switchMap(() => onFrameChange)
    ).subscribe((delta) => this.applyChange(delta));
  }

  private moveFrame(state: RiveAnimationState, time: number) {
    if (!this.animation) throw new Error('Could not load animation before running it');
    if (!this.animationInstance) throw new Error('Could not load animation instance before running it');
    const { speed, autoreset, mode } = state;
    return (time / 1000) * speed;
  }

  private applyChange(delta: number) {
    if (!this.canvas.rive) throw new Error('Could not load rive before registrating animation');
    if (!this.canvas.artboard) throw new Error('Could not load artboard before registrating animation');
    if (!this.canvas.renderer) throw new Error('Could not load renderer before registrating animation');
    if (!this.animationInstance) throw new Error('Could not load animation instance before runningit');
    const { rive, artboard, renderer, ctx, fit, alignment } = this.canvas;
    // Move frame
    this.animationInstance.advance(delta);
    this.animationInstance.apply(artboard, this.state.getValue().mix);
    artboard.advance(delta);
    // Render frame on canvas
    const box = this.canvas.box;
    ctx.clearRect(0, 0, this.canvas.width as number, this.canvas.height as number);
    ctx.save();
    renderer.align(rive.Fit[fit], rive.Alignment[alignment], box, artboard.bounds);
    artboard.draw(renderer);
    ctx.restore();
  }

}