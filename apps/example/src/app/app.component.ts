import { Component } from '@angular/core';

interface AnimationFile {
  name: string;
  animations: AnimationState[];
}
interface AnimationState {
  name: string;
  playing: boolean;
  time: number;
  speed: number;
  start: number;
  end: number;
  mix: number;
  mode?: 'loop' | 'ping-pong' | 'one-shot';
}

function createAnimation(name: string, start: number = 0, end?: number) {
  return {
    name,
    start,
    end,
    playing: false,
    time: start,
    speed: 1,
    mix: 0.5,
  }
}

@Component({
  selector: 'ng-rive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  trackByName = (i, item) => item.name; 
  files: AnimationFile[] = [{
    name: 'files',
    animations: [
      createAnimation('idle', 0.5, 4.5),
      createAnimation('rollover_in'),
      createAnimation('rollover_out')
    ]
  }, {
    name: 'knight',
    animations: [
      createAnimation('idle', 0.9, 7),
      createAnimation('day_night'),
      createAnimation('night_day')
    ]
  }];
}
