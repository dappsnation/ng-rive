import { Directive, EventEmitter, Input, NgZone, OnDestroy, Output } from "@angular/core";
import { BehaviorSubject, merge, of, Subscription } from "rxjs";
import { distinctUntilChanged, filter, map, switchMap } from "rxjs/operators";
import { RiveCanvasDirective } from './canvas';
import { RiveService } from "./service";
import { LinearAnimation, LinearAnimationInstance } from "rive-canvas";

interface RivePlayerState {
  speed: number;
  playing: boolean;
  /** Weight of this animation over another */
  mix: number;
  /** Reset automatically to 0 when play is down if mode is "one-shot" */
  autoreset: boolean;
  /** override mode of the animation */
  mode?: 'loop' | 'ping-pong' | 'one-shot';
}

function getRivePlayerState(state: Partial<RivePlayerState> = {}): RivePlayerState {
  return {
    speed: 1,
    playing: false,
    mix: 1,
    autoreset: false,
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

  @Input()
  set mode(mode: RivePlayerState['mode']) {
    if (mode) this.update({ mode });
  }
  get mode() {
    return this.state.getValue().mode;
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

  @Input()
  set autoreset(autoreset: boolean | '' | undefined | null) {
    if (autoreset === true || autoreset === '') {
      this.update({ autoreset: true });
    } else if (autoreset === false) {
      this.update({ autoreset: false });
    }
  }
  get autoreset() {
    return this.state.getValue().autoreset;
  }
  
  @Input()
  set time(value: number | string | undefined | null) {
    const time = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof time === 'number') this.distance.next(time);
  }


  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() load = new EventEmitter<LinearAnimation>();
  @Output() timeChange = new EventEmitter<number>();
  @Output() playChange = new EventEmitter<boolean>();
  @Output() speedChange = new EventEmitter<number>();

  private animation?: LinearAnimation;
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
    if (!this.canvas.rive) throw new Error('Could not load animation instance before rive');
    if (!this.canvas.artboard) throw new Error('Could not load animation instance before artboard');
    this.animation = typeof name === 'string'
      ? this.canvas.artboard.animationByName(name)
      : this.canvas.artboard.animationByIndex(name);

    this.startTime = round((this.animation.workStart === -1 ? 0 : this.animation.workStart) / this.animation.fps);
    this.endTime = round((this.animation.workEnd === -1 ? this.animation.duration : this.animation.workEnd) / this.animation.fps);
    
    this.instance = new this.canvas.rive.LinearAnimationInstance(this.animation);
    this.load.emit(this.animation);
  }

  private getTime() {
    if (!this.instance) throw new Error('Could not load animation instance before running it');
    return this.instance.time;
  }


  private getFrame(state: RivePlayerState) {
    if (state.playing) {
      return this.service.frame.pipe(map((time) => [state, time] as const));
    } else {
      return of(null)
    }
  }

  private register(name: string | number) {
    // Stop subscribing to previous animation if any
    this.sub?.unsubscribe(); 

    // Update if time have changed from the input
    const onTimeChange = this.distance.pipe(
      filter(exist),
      filter(time => time !== this.getTime()),
      distinctUntilChanged(),
      map(time => time - this.getTime()),
    );

    // Update on frame change if playing
    const onFrameChange = this.state.pipe(
      switchMap((state) => this.getFrame(state)),
      filter(exist),
      map(([state, time]) => this.moveFrame(state, time))
    );

    // Wait for canvas & animation to be loaded
    this.sub = this.canvas.onReady().pipe(
      map(() => this.initAnimation(name)),
      switchMap(() => merge(onTimeChange, onFrameChange))
    ).subscribe((delta) => this.applyChange(delta));
  }

  private moveFrame(state: RivePlayerState, time: number) {
    if (!this.animation) throw new Error('Could not load animation before running it');
    if (!this.instance) throw new Error('Could not load animation instance before running it');
    const { speed, autoreset, mode } = state;
    // Default mode, don't apply any logic
    if (!mode) return time / 1000 * speed;

    let delta = (time / 1000) * speed;
    
    // Round to avoid JS error on division
    const start = this.startTime ?? 0;
    const end = this.endTime ?? (this.animation.duration / this.animation.fps);
    const currentTime = round(this.instance.time);

    // When player hit floor
    if (currentTime + delta < start) {
      if (mode === 'loop' && speed < 0 && end) {
        delta = end - currentTime; // end - currentTime
      } else if (mode === 'ping-pong') {
        delta = -delta;
        this.update({ speed: -speed });
        this.zone.run(() => this.speedChange.emit(-speed));
      } else if (mode === 'one-shot') {
        this.update({ playing: false });
        this.zone.run(() => this.playChange.emit(false));
        delta = start - currentTime;
      }
    }

    // Put before "hit last frame" else currentTime + delta > end
    if (mode === 'one-shot' && autoreset) {
      if (speed > 0 && currentTime === end) {
        delta = start - end;
      }
      if (speed < 0 && currentTime === start) {
        delta = end - start;
      }
    }

    // When player hit last frame
    if (currentTime + delta > end) {
      if (mode === 'loop' && speed > 0) {
        delta = start - currentTime;
      } else if (mode === 'ping-pong') {
        delta = -delta;
        this.update({ speed: -speed });
        this.zone.run(() => this.speedChange.emit(-speed));
      } else if (mode === 'one-shot') {
        this.update({ playing: false });
        this.zone.run(() => this.playChange.emit(false));
        delta = end - currentTime;
      }
    }
  
    return delta;
  }

  private applyChange(delta: number) {
    if (!this.instance) throw new Error('Could not load animation instance before running it');
    this.canvas.draw(this.instance, delta, this.state.getValue().mix);
  }

}