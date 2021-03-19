import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LinearAnimation, Artboard } from 'rive-canvas';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RiveFilesService } from '../service';

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

function createAnim(animation: LinearAnimation): AnimationState {
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
  trackByName = (i: number, state: AnimationState) => state.name;
  file$ = this.route.paramMap.pipe(
    map(params => params.get('name')),
    switchMap(path => this.service.valueChanges(path)),
    switchMap(file => file ? this.http.get(file.url, { responseType: 'blob' }) : of(undefined))
  );
  animations: AnimationState[] = [];
  height = 500;
  width = 500;
  rounded = false;

  constructor(
    private service: RiveFilesService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  setArtboard(arboard: Artboard) {
    this.animations = new Array(arboard.animationCount())
      .fill(null)
      .map((_, i) => arboard.animationAt(i))
      .map(createAnim);
    this.cdr.markForCheck();
  }

  setDuration(state: AnimationState, animation: LinearAnimation) {
    if (!animation) return;
    const start = animation.workStart / animation.fps;
    const end = (animation.workEnd || animation.duration) / animation.fps;
    state.start = start;
    state.end = end;
    state.time = start;
    this.cdr.detectChanges();
  }
}
