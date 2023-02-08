import { Directive, EventEmitter, Input, NgZone, OnDestroy, Output } from "@angular/core";
import { BehaviorSubject, merge, of, Subscription } from "rxjs";
import { distinctUntilChanged, filter, map, switchMap, take, tap } from "rxjs/operators";
import { RiveCanvasDirective } from './canvas';
import { RiveService } from "./service";
import { LinearAnimationInstance } from "@rive-app/canvas-advanced";
import { nextFrame } from "./frame";

interface RivePlayerState {
  speed: number;
  playing: boolean;
  /** Weight of this animation over another */
  mix: number;
}

function getRivePlayerState(state: Partial<RivePlayerState> = {}): RivePlayerState {
  return {
    speed: 1,
    playing: false,
    mix: 1,
    ...state
  }
}

export function frameToSec(frame: number, fps: number) {
  return frame / fps;
}

export function round(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function exist<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}

function getStart(animation: LinearAnimationInstance) {
  if (!animation.workStart || animation.workStart === -1) return 0;
  return round(animation.workStart / animation.fps);
}

function getEnd(animation: LinearAnimationInstance) {
  const end = (!animation.workEnd ||animation.workEnd === -1) ? animation.duration : animation.workEnd;
  return round(end / animation.fps);
}

@Directive({
  selector: 'riv-player, [rivPlayer]',
  exportAs: 'rivPlayer'
})
export class RivePlayer implements OnDestroy {
  private sub?: Subscription;
  startTime?: number;
  endTime?: number;
  distance = new BehaviorSubject<number | null>(null);
  state = new BehaviorSubject<RivePlayerState>(getRivePlayerState());

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

  /** Multiplicator of the speed for the animation */
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

  
  @Input()
  set time(value: number | string | undefined | null) {
    const time = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof time === 'number') this.distance.next(time);
  }


  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() load = new EventEmitter<LinearAnimationInstance>();
  @Output() timeChange = new EventEmitter<number>();

  private instance?: LinearAnimationInstance;

  constructor(
    private zone: NgZone,
    private canvas: RiveCanvasDirective,
    private service: RiveService,
  ) {}

  
  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.instance?.delete();
  }

  private update(state: Partial<RivePlayerState>) {
    const next = getRivePlayerState({...this.state.getValue(), ...state })
    this.state.next(next);
  }

  private initAnimation(name: string | number) {
    if (!this.service.rive) throw new Error('Could not load animation instance before rive');
    if (!this.canvas.artboard) throw new Error('Could not load animation instance before artboard');
    
    const ref = typeof name === 'string'
      ? this.canvas.artboard.animationByName(name)
      : this.canvas.artboard.animationByIndex(name);

    this.startTime = getStart(ref);
    this.endTime = getEnd(ref);
    this.instance = new this.service.rive.LinearAnimationInstance(ref, this.canvas.artboard);
    
    this.load.emit(this.instance);
  }

  private getFrame(state: RivePlayerState) {
    if (state.playing && this.service.frame) {
      return this.service.frame.pipe(map((time) => [state, time] as const));
    } else {
      return of(null)
    }
  }

  private register(name: string | number) {
    this.sub?.unsubscribe();  // Stop subscribing to previous animation if any
    this.instance?.delete();  // Remove old instance if any

    // Update if time have changed from the input
    const onTimeChange = this.distance.pipe(
      filter(exist),
      filter(time => time !== this.instance?.time),
      distinctUntilChanged(),
      map(time => time - this.instance!.time),
    );

    // Update on frame change if playing
    const onFrameChange = this.state.pipe(
      switchMap((state) => this.getFrame(state)),
      filter(exist),
      map(([state, time]) => (time / 1000) * state.speed),
      tap((delta) => {
        this.zone.run(() => this.timeChange.emit(this.instance!.time + delta))
      })
    );

    // Wait for canvas & animation to be loaded
    this.sub = this.canvas.onReady().pipe(
      map(() => this.initAnimation(name)),
      switchMap(() => merge(onTimeChange, onFrameChange))
    ).subscribe((delta) => this.applyChange(delta));
  }

  private applyChange(delta: number) {
    // We need to use requestAnimationFrame in case we set the time
    this.service.rive?.requestAnimationFrame(() => {
      if (!this.instance) throw new Error('Could not load animation instance before running it');
      this.canvas.draw(this.instance, delta, this.state.getValue().mix);
    });
  }

}