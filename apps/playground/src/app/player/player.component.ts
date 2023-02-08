import { Component } from '@angular/core';

@Component({
  selector: 'ng-rive-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent {
  time: number | null = 0.3;
}
