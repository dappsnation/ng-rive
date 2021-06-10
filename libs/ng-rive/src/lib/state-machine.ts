import { EventEmitter, Directive, NgZone, OnDestroy, Output, Input, ContentChildren, QueryList } from '@angular/core';
import { SMIInput, StateMachine, StateMachineInstance } from 'rive-canvas';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { RiveCanvasDirective } from './canvas';
import { RiveService } from './service';

///////////
// INPUT //
///////////
const enum InputTypes {
  Number = 56,
  Trigger = 58,
  Boolean = 59,
}

function getInput(input: SMIInput) {
  if (input.type === InputTypes.Number) return input.asNumber();
  if (input.type === InputTypes.Boolean) return input.asBool();
  if (input.type === InputTypes.Trigger) return input.asTrigger();
  return input;
}

@Directive({
  selector: 'riv-input, [rivInput]',
  exportAs: 'rivInput'
})
export class RiveSMInput {
  private _name?: string;
  private _value?: boolean | number;
  private input?: SMIInput;
  private shouldFire?: (input: SMIInput) => void;

  @Input()
  set name(name: string | undefined) {
    if (!name) return;
    this._name = name;
    if (this.input) return;
    this.init(this.stateMachine.inputs[name]);
  }
  get name() {
    return this.input?.name ?? this._name;
  }

  @Input()
  set value(rawValue: string | boolean | number | undefined) {
    if (typeof rawValue === 'undefined') return;
    const value = typeof rawValue === 'string'
      ? parseFloat(rawValue)
      : rawValue;
    if (this.input) {
      this.input.value = value;
      this.change.emit(this.input);
    } else {
      this._value = value;
    }
  }
  get value() {
    return this.input?.value ?? this._value;
  }

  @Output() change = new EventEmitter<SMIInput>();
  @Output() load = new EventEmitter<SMIInput>();

  constructor(private stateMachine: RiveStateMachine) {}

  /** @internal: Used by the RiveStateMachine */
  public init(input?: SMIInput) {
    if (!input || input.name === this.input?.name) return;
    this.input = getInput(input);
    this.load.emit(input);
    if (typeof this._value !== 'undefined') {
      this.input.value = this._value;
      this.change.emit(this.input);
    }
    if (this.shouldFire) {
      this.shouldFire(input);
      delete this.shouldFire;
    }
  }

  fire() {
    const fire = (input: SMIInput) => {
      if (input.type === InputTypes.Trigger) {
        input.fire();
        this.change.emit(input);
      }
    }
    this.input
      ? fire(this.input)
      : this.shouldFire = fire; 
  }
}


///////////////////
// STATE MACHINE //
///////////////////

interface StateMachineState {
  speed: number;
  playing: boolean;
}

function exist<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}


@Directive({
  selector: 'riv-state-machine, [rivStateMachine]',
  exportAs: 'rivStateMachine'
})
export class RiveStateMachine implements OnDestroy {
  private sub?: Subscription;
  private stateMachine?: StateMachine;
  /** @internal: public only for RiveInput */
  public instance?: StateMachineInstance;
  public state = new BehaviorSubject<StateMachineState>({ speed: 1, playing: false });

  public inputs: Record<string, SMIInput> = {}; 
  @ContentChildren(RiveSMInput) private riveInputs?: QueryList<RiveSMInput>;

  @Output() load = new EventEmitter<StateMachine>();
  @Output() stateChange = new EventEmitter<string[]>();

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
  
  constructor(
    private zone: NgZone,
    private canvas: RiveCanvasDirective,
    private service: RiveService,
  ) {}

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.instance?.delete();
  }

  private update(state: Partial<StateMachineState>) {
    this.state.next({...this.state.getValue(), ...state });
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
      map(() => this.initStateMachine(name)),
      switchMap(() => onFrameChange)
    ).subscribe((delta) => this.applyChange(delta));
  }

  private initStateMachine(name: string | number) {
    if (!this.canvas.rive) throw new Error('Could not load state machine instance before rive');
    if (!this.canvas.artboard) throw new Error('Could not load state machine instance before artboard');
    this.stateMachine = typeof name === 'string'
      ? this.canvas.artboard.stateMachineByName(name)
      : this.canvas.artboard.stateMachineByIndex(name);
    this.instance = new this.canvas.rive.StateMachineInstance(this.stateMachine);
    // Fetch the inputs from the runtime if we don't have them
    for (let i = 0; i < this.instance.inputCount(); i++) {
      this.setInput(this.instance.input(i));
    }
    this.load.emit(this.stateMachine);
  }

  private setInput(input: SMIInput) {
    this.inputs[input.name] = input;
    const riveInput = this.riveInputs?.find(item => item.name === input.name);
    if (riveInput) {
      riveInput.init(input);
    }
  }

  private getFrame(state: StateMachineState) {
    if (state.playing) {
      return this.service.frame.pipe(map((time) => [state, time] as const));
    } else {
      return of(null)
    }
  }

  private moveFrame(state: StateMachineState, time: number) {
    return (time / 1000) * state.speed;
  }

  // TODO: move this logic to the canvas by registering an hook

  private applyChange(delta: number) {
    if (!this.canvas.rive) throw new Error('Could not load rive before registrating state machine');
    if (!this.canvas.artboard) throw new Error('Could not load artboard before registrating state machin');
    if (!this.canvas.renderer) throw new Error('Could not load renderer before registrating state machin');
    if (!this.instance) throw new Error('Could not load state machin instance before runningit');
    const { rive, artboard, renderer, ctx, fit, alignment } = this.canvas;
    // Move frame
    this.instance.advance(artboard, delta);
    artboard.advance(delta);
    // Render frame on canvas
    const box = this.canvas.box;
    ctx.clearRect(0, 0, this.canvas.width as number, this.canvas.height as number);
    ctx.save();
    renderer.align(rive.Fit[fit], rive.Alignment[alignment], box, artboard.bounds);
    artboard.draw(renderer);

    // Check for any state machines that had a state change
    const changeCount = this.instance.stateChangedCount();
    if (changeCount) {
      const states = new Array(changeCount).fill(null).map((_, i) => this.instance!.stateChangedNameByIndex(i));
      this.stateChange.emit(states);
    }

    ctx.restore();
  }

}


