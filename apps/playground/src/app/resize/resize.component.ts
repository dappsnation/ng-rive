import { Component, OnInit } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'ng-rive-resize',
  templateUrl: './resize.component.html',
  styleUrls: ['./resize.component.scss']
})
export class ResizeComponent {
  size = 442;
  setSize(event: MatSliderChange) {
    if (event.value) this.size = event.value;
  }
}
