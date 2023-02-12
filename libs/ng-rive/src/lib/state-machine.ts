import { EventEmitter, Directive, NgZone, OnDestroy, Output, Input, ContentChildren, QueryList } from '@angular/core';
import { Artboard, SMIInput, StateMachineInstance } from '@rive-app/canvas-advanced';
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

function assertStateMachine(animation: StateMachineInstance, artboard: Artboard, name: string | number) {
  if (animation) return;
  const artboardName = artboard.name ?? 'Default';
  const count = artboard.stateMachineCount();
  if (typeof name === 'number') {
    throw new Error(`Provided index "${name}" for the animation of artboard "${artboardName}" is not available. Animation count is: ${count}`)
  } else {
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push(artboard.stateMachineByIndex(i).name);
    }
    throw new Error(`Provided name "${name}" for the animation of artboard "${artboardName}" is not available. Availables names are: ${JSON.stringify(names)}`);
  }
  
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
  set value(rawValue: string | boolean | number | undefined | null) {
    if (typeof rawValue === 'undefined' || rawValue === null) return;
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
  /** @internal: public only for RiveInput */
  public instance?: StateMachineInstance;
  public state = new BehaviorSubject<StateMachineState>({ speed: 1, playing: false });

  public inputs: Record<string, SMIInput> = {}; 
  @ContentChildren(RiveSMInput) private riveInputs?: QueryList<RiveSMInput>;

  @Output() load = new EventEmitter<StateMachineInstance>();
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

  private setInput(input: SMIInput) {
    this.inputs[input.name] = input;
    const riveInput = this.riveInputs?.find(item => item.name === input.name);
    if (riveInput) {
      riveInput.init(input);
    }
  }

  private getFrame(state: StateMachineState) {
    if (state.playing && this.service.frame) {
      return this.service.frame.pipe(map((time) => [state, time] as const));
    } else {
      return of(null)
    }
  }

  
  private initStateMachine(name: string | number) {
    if (!this.canvas.rive) throw new Error('Could not load state machine instance before rive');
    if (!this.canvas.artboard) throw new Error('Could not load state machine instance before artboard');
    const ref = typeof name === 'string'
      ? this.canvas.artboard.stateMachineByName(name)
      : this.canvas.artboard.stateMachineByIndex(name);
    
    assertStateMachine(ref, this.canvas.artboard, name);
    
    // Fetch the inputs from the runtime if we don't have them
    this.instance = new this.canvas.rive.StateMachineInstance(ref, this.canvas.artboard);
    for (let i = 0; i < this.instance.inputCount(); i++) {
      this.setInput(this.instance.input(i));
    }
    this.load.emit(this.instance);
  }

  private register(name: string | number) {
    // Stop subscribing to previous animation if any
    this.sub?.unsubscribe(); 

    // Update on frame change if playing
    const onFrameChange = this.state.pipe(
      switchMap((state) => this.getFrame(state)),
      filter(exist),
      map(([state, time]) => (time / 1000) * state.speed)
    );

    // Wait for canvas & animation to be loaded
    this.sub = this.canvas.onReady().pipe(
      map(() => this.initStateMachine(name)),
      switchMap(() => onFrameChange)
    ).subscribe((delta) => this.applyChange(delta));
  }

  private applyChange(delta: number) {
    if (!this.instance) throw new Error('Could not load state machin instance before running it');
    this.canvas.draw(this.instance, delta);
    // Check for any state machines that had a state change
    const changeCount = this.instance.stateChangedCount();
    if (changeCount) {
      const states = [];
      for (let i = 0; i < changeCount; i++) {
        states.push(this.instance.stateChangedNameByIndex(i));
      }
      this.stateChange.emit(states);
    }
  }

}


