import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'ng-rive-state-machine',
  templateUrl: './state-machine.component.html',
  styleUrls: ['./state-machine.component.scss']
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
