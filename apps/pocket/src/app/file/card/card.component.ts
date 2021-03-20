import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { Artboard } from 'rive-canvas';
import { ReplaySubject, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'rive-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  private url$ = new ReplaySubject<string>();
  hover$ = new BehaviorSubject<boolean>(false);
  animation$ = new BehaviorSubject<string>('');
  file$ = this.url$.pipe(
    switchMap(url => this.http.get(url, { responseType: 'blob' }))
  );

  @Input() set url(url: string) {
    if (!url) return;
    this.url$.next(url);
  }

  @HostListener('mouseenter') enter() {
    this.hover$.next(true);
  }
  @HostListener('mouseleave') leave() {
    this.hover$.next(false);
  }

  constructor(private http: HttpClient) { }


  setArtboard(artboard: Artboard) {
    this.animation$.next(artboard.animationAt(0).name);
  }
}
