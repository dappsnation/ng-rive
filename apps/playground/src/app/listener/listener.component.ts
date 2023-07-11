import { Component } from '@angular/core';
import { RiveStateMachine, RiveLinearAnimation, RiveCanvas } from 'ng-rive';

@Component({
    selector: 'rive-listener',
    templateUrl: './listener.component.html',
    styleUrls: ['./listener.component.scss'],
    standalone: true,
    imports: [
        RiveCanvas,
        RiveLinearAnimation,
        RiveStateMachine,
    ],
})
export class ListenerComponent {
}
