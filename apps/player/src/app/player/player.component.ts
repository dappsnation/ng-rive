import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LinearAnimation, Artboard } from 'rive-canvas';
import { map } from 'rxjs/operators';
import { Service } from '../service';

export interface AnimationState {
  name: string;
  playing: boolean;
  time?: number | null;
  speed: number;
  mix: number;
  mode?: 'loop' | 'ping-pong' | 'one-shot';
  duration?: { start: number, end: number };
}

function createAnim(animation: LinearAnimation): AnimationState {
  return {
    name: animation.name,
    speed: animation.speed,
    time: animation.workStart || 0,
    playing: false,
    mix: 1,
    duration: {
      start: animation.workStart || 0,
      end: animation.workEnd
    }
  }
}

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
    map(name => name ? this.service.files[name] : undefined)
  );
  animations: AnimationState[] = [];

  constructor(
    private service: Service,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  setArtboard(arboard: Artboard) {
    this.animations = new Array(arboard.animationCount())
      .fill(null)
      .map((_, i) => arboard.animationAt(i))
      .map(createAnim)
  }

  setDuration(state: AnimationState, animation: LinearAnimation) {
    if (!animation) return;
    const start = animation.workStart / animation.fps;
    const end = (animation.workEnd || animation.duration) / animation.fps;
    state.duration = { start, end };
    state.time = start;
    this.cdr.detectChanges();
  }
}
