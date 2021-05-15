import { Directive, ElementRef, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { RiveService } from './service';
import { Artboard, CanvasRenderer, RiveCanvas, File as RiveFile, AABB } from 'rive-canvas';
import { toInt } from './utils';

export type CanvasFit = 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight' | 'none' | 'scaleDown';
export type CanvasAlignment = 'center' | 'topLeft' | 'topCenter' | 'topRight' | 'centerLeft' | 'centerRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

export type RiveOrigin = string | File | Blob | null;

const exist = <T>(v?: T | null): v is T => v !== null && v !== undefined;


// Observable that trigger once when element is visible
const onVisible = (element: HTMLElement) => new Observable<boolean>((subscriber) => {
  // SSR
  if (typeof window === 'undefined') {
    subscriber.next(false);
    subscriber.complete();
    return;
  }
  // Compatibility
  if (!('IntersectionObserver' in window)) {
    subscriber.next(true);
    subscriber.complete();
    return;
  }
  let isVisible = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const visible = entry.intersectionRatio !== 0;
      if (visible !== isVisible) {
        isVisible = !isVisible;
        subscriber.next(isVisible);
        subscriber.complete();
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
  private url = new ReplaySubject<RiveOrigin>();
  private arboardName = new BehaviorSubject<string | null>(null);
  private _ctx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  private loaded: Observable<boolean>;
  private boxes: Record<string, AABB> = {};
  public canvas: HTMLCanvasElement | OffscreenCanvas;
  public rive?: RiveCanvas;
  public file?: RiveFile; 
  public artboard?: Artboard;
  public renderer?: CanvasRenderer;

  public isVisible: Observable<boolean>;

  @Input('riv') set riv(url: RiveOrigin) {
    this.url.next(url);
  }

  @Input('artboard') set name(name: string) {
    this.arboardName.next(name);
  }

  @Input() viewbox: string = '0 0 100% 100%';
  @Input() lazy: boolean | '' = false;
  @Input() fit: CanvasFit = 'contain';
  @Input() alignment: CanvasAlignment = 'center';
  set width(w: number | string) {
    this.canvas.width = toInt(w) ?? this.canvas.width;
  }
  get width() {
    return this.canvas.width;
  }
  @Input()
  set height(h: number | string) {
    this.canvas.height = toInt(h) ?? this.canvas.height;
  }
  get height() {
    return this.canvas.height;
  }

  @Output() artboardChange = new EventEmitter<Artboard>();

  constructor(
    private zone: NgZone,
    private service: RiveService,
    element: ElementRef<HTMLCanvasElement>
  ) {
    this.canvas = element.nativeElement;

    this.isVisible = onVisible(element.nativeElement).pipe(
      shareReplay(1),
      enterZone(this.zone),
    );

    this.loaded = this.url.pipe(
      filter(exist),
      distinctUntilChanged(),
      filter(() => typeof window !== 'undefined' && !!this.ctx),  // Make sure it's not ssr
      switchMap(async (url) => {
        this.file = await this.service.load(url);
        this.rive = this.service.rive;
        if (!this.rive) throw new Error('Service could not load rive');
        this.renderer = new this.rive.CanvasRenderer(this.ctx)
      }),
      switchMap(_ => this.setArtboard()),
      shareReplay(1)
    );
  }


  ngOnInit() {
    this.onReady().pipe(take(1)).subscribe();
  }

  get ctx(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
    if (!this._ctx) {
      this._ctx = this.canvas.getContext('2d');
    }
    return this._ctx!;
  }

  private setArtboard() {
    return this.arboardName.pipe(
      map(name => this.artboard = name ? this.file?.artboardByName(name) : this.file?.defaultArtboard()),
      tap(_ => this.artboardChange.emit(this.artboard)),
      map(_ => true)
    );
  }

  /**
   * Calculate the box of the canvas based on viewbox, width and height
   * It memorizes the values to avoid recalculation for each frame
   */
  get box() {
    const w = this.width as number;
    const h = this.height as number;
    const boxId = `${this.viewbox} ${w} ${h}`;
    if (!this.boxes[boxId]) {
      const bounds = this.viewbox.split(' ');
      if (bounds.length !== 4) throw new Error('View box should look like "0 0 100% 100%"');
      const [minX, minY, maxX, maxY] = bounds.map((v, i) => {
        const size = i % 2 === 0 ? w : h;
        const percentage = v.endsWith('%')
          ? parseInt(v.slice(0, -1), 10) / 100
          : parseInt(v, 10) / size;
        return i < 2 ? -size * percentage : size / percentage;
      });
      this.boxes[boxId] = {minX, minY, maxX, maxY};
    }
    return this.boxes[boxId];
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

