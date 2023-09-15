import { Component } from '@angular/core';
import { RiveCanvas, RiveLinearAnimation } from 'ng-rive';

@Component({
    selector: 'ng-rive-multi-animation',
    templateUrl: './multi-animation.component.html',
    styleUrls: ['./multi-animation.component.scss'],
    standalone: true,
    imports: [RiveCanvas, RiveLinearAnimation]
})
export class MultiAnimationComponent {
  time: number | null = 0.3;
}
