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
    const move = () => {
      if (this.x) {
        if (this.x > 1) this.x--;
        else if (this.x < -1) this.x++;
        else this.x = 0;
      }
      if (this.y) {
        if (this.y > 1) this.y--;
        else if (this.y < -1) this.y++;
        else this.y = 0;
      }
      if (this.x || this.y) requestAnimationFrame(move);
    }
    requestAnimationFrame(move);
  }
}
