import { Component } from '@angular/core';
import { RivePlayer } from '../../../../../libs/ng-rive/src/lib/player';
import { RiveCanvas } from '../../../../../libs/ng-rive/src/lib/canvas';

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
