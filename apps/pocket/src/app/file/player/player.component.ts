import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'apps/pocket/src/environments/environment';
import { LinearAnimation, Artboard } from 'rive-canvas';
import { CanvasFit, CanvasAlignment } from 'ng-rive';
import { of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { RiveFile, RiveFilesService } from '../service';

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
  riveFile$ = this.route.paramMap.pipe(
    map(params => params.get('fileId')),
    switchMap(fileId => this.service.valueChanges(fileId)),
    shareReplay(1)
  );
  file$ = this.riveFile$.pipe(
    switchMap(file => file ? this.http.get(file.url, { responseType: 'blob' }) : of(undefined))
  );

  canvasFit: CanvasFit[] = ['cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none', 'scaleDown'];
  canvasAlignment: CanvasAlignment[] = ['center', 'topLeft', 'topCenter', 'topRight', 'centerLeft', 'centerRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];
  animations: AnimationState[] = [];
  fit: CanvasFit = 'cover';
  alignment: CanvasAlignment = 'center';
  height = 500;
  width = 500;
  radius = 0;
  transparent = false;
  color = '#ffffff';

  constructor(
    private service: RiveFilesService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private clipboard: Clipboard,
    private snackbar: MatSnackBar
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

  copy(riveFile: RiveFile) {
    this.clipboard.copy(`${environment.baseUrl}/player/${riveFile.id}`);
    this.snackbar.open('Link copied 🎈', '', { duration: 1500 });
  }
}
