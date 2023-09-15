import { Component } from '@angular/core';
import { RiveCanvas, RivePlayer } from 'ng-rive';

@Component({
    selector: 'ng-rive-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss'],
    standalone: true,
    imports: [RiveCanvas, RivePlayer]
})
export class PlayerComponent {
  time: number | null = 0.3;
}
