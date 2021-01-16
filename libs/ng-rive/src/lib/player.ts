import { Directive, EventEmitter, Input, Output } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { RiveCanvasDirective } from './canvas';

interface RivePlayerState {
  speed: number;
  direction: 1 | -1;
  playing: boolean;
  /** Weight of this animation over another */
  mix: number;
  /** Reset automatically to 0 when play is down if mode is "one-shot" */
  autoreset: boolean;
  /** override mode of the animation */
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

  constructor(private rive: RiveCanvasDirective) {}

  update(state: Partial<RivePlayerState>) {
    const next = getRivePlayerState({...this.state.getValue(), ...state })
    this.state.next(next);
  }
}