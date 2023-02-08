import { Directive, EventEmitter, Input, NgZone, OnDestroy, Output } from "@angular/core";
import { BehaviorSubject, of, Subscription } from "rxjs";
import { filter, map, switchMap } from "rxjs/operators";
import { enterZone, RiveCanvasDirective } from './canvas';
import { RiveService } from "./service";
import type { LinearAnimationInstance } from "@rive-app/canvas-advanced";

interface RiveAnimationState {
  speed: number;
  playing: boolean;
  /** Weight of this animation over another */
  mix: number;
}

function getRiveAnimationState(state: Partial<RiveAnimationState> = {}): RiveAnimationState {
  return {
    speed: 1,
    playing: false,
    mix: 1,
    ...state
  }
}


function exist<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}

@Directive({
  selector: 'riv-animation, [rivAnimation]',
  exportAs: 'rivAnimation'
})
export class RiveAnimationDirective implements OnDestroy {
  private sub?: Subscription;
  private instance?: LinearAnimationInstance;
  distance = new BehaviorSubject<number | null>(null);
  state = new BehaviorSubject<RiveAnimationState>(getRiveAnimationState());

  /**
   * Name of the rive animation in the current Artboard
   * Either use name or index to select an animation
   */
  @Input()
  set name(name: string | undefined | null) {
    if (typeof name !== 'string') return;
    this.zone.runOutsideAngular(() => {
      this.register(name);
    });
  }

  /**
   * Index of the rive animation in the current Artboard 
   * Either use index of name to select an animation
   */
  @Input()
  set index(value: number | string | undefined | null) {
    const index = typeof value === 'string' ? parseInt(value) : value;
    if (typeof index !== 'number') return;
    this.zone.runOutsideAngular(() => {
      this.register(index);
    });
  }

  /** The mix of this animation in the current arboard */
  @Input()
  set mix(value: number | string | undefined | null) {
    const mix = typeof value === 'string' ? parseFloat(value) : value; 
    if (mix && mix >= 0 && mix <= 1) this.update({ mix });
  }
  get mix() {
    return this.state.getValue().mix;
  }

  /** Multiplicator for the speed of the animation */
  @Input()
  set speed(value: number | string | undefined | null) {
    const speed = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof speed === 'number') this.update({ speed });
  }
  get speed() {
    return this.state.getValue().speed;
  }

  /** If true, this animation is playing */
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
  
  /** Emit when the LinearAnimation has been instantiated */
  @Output() load = new EventEmitter<LinearAnimationInstance>();

  constructor(
    private zone: NgZone,
    private canvas: RiveCanvasDirective,
    private service: RiveService,
  ) {}
  
  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.instance?.delete();
  }

  private update(state: Partial<RiveAnimationState>) {
    const next = getRiveAnimationState({...this.state.getValue(), ...state })
    this.state.next(next);
  }

  private getFrame(state: RiveAnimationState) {
    if (state.playing && this.service.frame) {
      return this.service.frame.pipe(map((time) => [state, time] as const));
    } else {
      return of(null)
    }
  }

  private initAnimation(name: string | number) {
    if (!this.canvas.rive) throw new Error('Could not load animation instance before rive');
    if (!this.canvas.artboard) throw new Error('Could not load animation instance before artboard');
    const ref = typeof name === 'string'
      ? this.canvas.artboard.animationByName(name)
      : this.canvas.artboard.animationByIndex(name);

    this.instance = new this.canvas.rive.LinearAnimationInstance(ref, this.canvas.artboard);
    this.load.emit(this.instance);
  }

  private register(name: string | number) {
    // Stop subscribing to previous animation if any
    this.sub?.unsubscribe(); 

    // Update on frame change if playing
    const onFrameChange = this.state.pipe(
      switchMap((state) => this.getFrame(state)),
      filter(exist),
      map(([state, time]) => (time / 1000) * state.speed),
    );

    // Wait for canvas & animation to be loaded
    this.sub = this.canvas.onReady().pipe(
      map(() => this.initAnimation(name)),
      switchMap(() => onFrameChange)
    ).subscribe((delta) => this.applyChange(delta));
  }

  private applyChange(delta: number) {
    if (!this.instance) throw new Error('Could not load animation instance before running it');
    this.canvas.draw(this.instance, delta, this.state.getValue().mix);
  }

}