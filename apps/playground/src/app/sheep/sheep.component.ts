import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ng-rive-sheep',
  templateUrl: './sheep.component.html',
  styleUrls: ['./sheep.component.scss']
})
export class SheepComponent {
  x = 0;
  y = 0;

  move(event: MouseEvent) {
    const { width, height, x, y } = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.x = 10 * ((2 * (event.x - x)) - width) / width;
    this.y = 10 * ((2 * (event.y - y)) - height) / height;
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }
}
