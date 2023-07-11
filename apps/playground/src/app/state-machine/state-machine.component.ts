import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RiveNode, RiveStateMachine, RiveSMInput, RiveCanvas } from 'ng-rive';

const imports = [
  RiveCanvas,
  RiveStateMachine,
  RiveSMInput,
  RiveNode,
  ReactiveFormsModule,
  MatSlideToggleModule,
  MatSliderModule,
  MatButtonModule,
  AsyncPipe
];

@Component({
    selector: 'ng-rive-state-machine',
    templateUrl: './state-machine.component.html',
    styleUrls: ['./state-machine.component.scss'],
    standalone: true,
    imports: imports
})
export class StateMachineComponent {
  form = new FormControl(0);
  value$ = this.form.valueChanges.pipe(startWith(this.form.value));

  loginForm = new FormGroup({
    loading: new FormControl(false),
    hide: new FormControl(false),
    eyes: new FormControl(false),
    look: new FormControl(0),
  });
  login$ = this.loginForm.valueChanges.pipe(startWith(this.loginForm.value));
  loading$ = this.login$.pipe(map(v => v.loading));
  hide$ = this.login$.pipe(map(v => v.hide));
  eyes$ = this.login$.pipe(map(v => v.eyes));
  look$ = this.login$.pipe(map(v => v.look));

  change(states: unknown) {
    console.log('Change', states)
  }
}
