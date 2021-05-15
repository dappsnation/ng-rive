import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'ng-rive-state-machine',
  templateUrl: './state-machine.component.html',
  styleUrls: ['./state-machine.component.scss']
})
export class StateMachineComponent implements OnInit {
  form = new FormControl(0);
  value$ = this.form.valueChanges.pipe(startWith(this.form.value));
  constructor() { }

  ngOnInit(): void {
  }

}
