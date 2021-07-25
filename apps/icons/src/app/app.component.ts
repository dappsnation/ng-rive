import { Component } from '@angular/core';

@Component({
  selector: 'ng-rive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  playing = false;
  list = new Array(50).fill(null);
}
