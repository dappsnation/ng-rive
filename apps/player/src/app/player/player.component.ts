import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { Service } from '../service';
import type { LinearAnimationInstance, Artboard } from '@rive-app/canvas-advanced';

export interface AnimationState {
  name: string;
  playing: boolean;
  time?: number | null;
  speed: number;
  mix: number;
  mode?: 'loop' | 'ping-pong' | 'one-shot';
  start: number;
  end: number;
}

function getMode(index: number) {
  return (['one-shot', 'loop', 'ping-pong'] as const)[index];
}

function createAnim(animation: LinearAnimationInstance): AnimationState {
  return {
    name: animation.name,
    speed: animation.speed,
    time: animation.workStart || 0,
    playing: false,
    mix: 1,
    mode: getMode(animation.loopValue),
    start: animation.workStart || 0,
    end: animation.workEnd
  }
}

@Component({
  selector: 'ng-rive-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent {
  animations: AnimationState[] = [];
  height = 500;
  width = 500;
  rounded = false;
  file$ = this.route.paramMap.pipe(
    map(params => params.get('name')),
    map(name => name ? this.service.files[name] : undefined)
  );
  trackByName = (i: number, state: AnimationState) => state.name;
    
  constructor(
    private service: Service,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  setArtboard(arboard: Artboard) {
    this.animations = new Array(arboard.animationCount())
      .fill(null)
      .map((_, i) => arboard.animationByIndex(i))
      .map(createAnim);
    this.cdr.detectChanges();
  }

  setDuration(state: AnimationState, animation: LinearAnimationInstance) {
    if (!animation) return;
    const start = animation.workStart / animation.fps;
    const end = (animation.workEnd || animation.duration) / animation.fps;
    state.start = start;
    state.end = end;
    state.time = start;
    this.cdr.detectChanges();
  }
  toggle(index: number) {
    this.animations[index].playing = !this.animations[index].playing;
    this.cdr.detectChanges();
  }
}
