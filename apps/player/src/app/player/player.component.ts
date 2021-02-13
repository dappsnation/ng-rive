import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LinearAnimation } from 'rive-canvas';
import { map } from 'rxjs/operators';
import { files, AnimationState } from '../animations';

@Component({
  selector: 'ng-rive-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent {
  trackByName = (i: number, state: AnimationState) => state.name;
  file$ = this.route.paramMap.pipe(
    map(params => params.get('name')),
    map(name => files.find(file => file.name === name))
  );

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  setDuration(state: AnimationState, animation: LinearAnimation) {
    if (!animation) return;
    const start = animation.workStart / animation.fps;
    const end = (animation.workEnd || animation.duration) / animation.fps;
    state.duration = { start, end };
    state.time = start;
    this.cdr.detectChanges();
  }
}
