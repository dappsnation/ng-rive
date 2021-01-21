import { Directive, ElementRef, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { RiveService } from './service';
import { Artboard, CanvasRenderer, RiveCanvas, File as RiveFile } from './types';

// Observable that trigger once when element is visible
const onVisible = (element: HTMLElement) => new Observable<boolean>((subscriber) => {
  if (!('IntersectionObserver' in window)) return subscriber.next(true);
  let isVisible = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const visible = entry.intersectionRatio !== 0;
      if (visible !== isVisible) {
        isVisible = !isVisible;
        subscriber.next(isVisible);
      }
    });
  }, { threshold: [0] });
  // start observing element visibility
  observer.observe(element);
});

// Force event to run inside zones
export function enterZone(zone: NgZone) {
  return <T>(source: Observable<T>) =>
    new Observable<T>(observer =>
      source.subscribe({
        next: (x) => zone.run(() => observer.next(x)),
        error: (err) => observer.error(err),
        complete: () => observer.complete()
    })
   );
}

@Directive({
  selector: 'canvas[riv]',
  exportAs: 'rivCanvas'
})
export class RiveCanvasDirective {
  private url = new ReplaySubject<string | File>();
  private arboardName = new BehaviorSubject<string | null>(null);
  private loaded: Observable<boolean>;
  public ctx: CanvasRenderingContext2D;
  public renderer?: CanvasRenderer;
  public rive?: RiveCanvas;
  public file?: RiveFile; 
  public canvas: HTMLCanvasElement;
  public artboard?: Artboard;

  public isVisible: Observable<boolean>;

  @Input('riv') set riv(url: string | File) {
    this.url.next(url);
  }

  @Input('artboard') set name(name: string) {
    this.arboardName.next(name);
  }
  @Input() lazy: boolean | '' = false;


  @Output() artboardChange = new EventEmitter<Artboard>();

  constructor(
    private zone: NgZone,
    private service: RiveService,
    element: ElementRef<HTMLCanvasElement>
  ) {
    this.canvas = element.nativeElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not find context of canvas');
    this.ctx = ctx;

    this.isVisible = onVisible(this.canvas).pipe(
      shareReplay(1),
      enterZone(this.zone),
    );

    this.loaded = this.url.pipe(
      filter(url => !!url),
      distinctUntilChanged(),
      switchMap(async (url) => {
        this.file = await this.service.load(url);
        this.rive = this.service.rive;
        if (!this.rive) throw new Error('Service could not load rive');
        this.renderer = new this.rive.CanvasRenderer(this.ctx);
      }),
      switchMap(_ => this.setArtboard()),
      shareReplay(1)
    );
  }


  ngOnInit() {
    this.onReady().pipe(take(1)).subscribe();
  }

  private setArtboard() {
    return this.arboardName.pipe(
      map(name => this.artboard = name ? this.file?.artboard(name) : this.file?.defaultArtboard()),
      tap(_ => this.artboardChange.emit(this.artboard)),
      map(_ => true)
    );
  }

  get isLazy() {
    return this.lazy === true || this.lazy === '';
  }

  get count() {
    return this.artboard?.animationCount();
  }

  onReady() {
    if (this.isLazy) {
      return this.isVisible.pipe(
        filter(visible => !!visible),
        take(1),
        switchMap(() => this.loaded)
      );
    }
    return this.loaded;
  }

}

