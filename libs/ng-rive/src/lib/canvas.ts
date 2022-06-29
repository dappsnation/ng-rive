import { Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { RiveService } from './service';
import { Artboard, CanvasRenderer, RiveCanvas, File as RiveFile, AABB, StateMachineInstance, LinearAnimationInstance } from '@rive-app/canvas-advanced';
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
export class RiveCanvasDirective implements OnInit, OnDestroy {
  private url = new ReplaySubject<RiveOrigin>();
  private arboardName = new BehaviorSubject<string | null>(null);
  private _ctx?: CanvasRenderingContext2D | null;
  private loaded: Observable<boolean>;
  private boxes: Record<string, AABB> = {};
  public canvas: HTMLCanvasElement;
  public rive?: RiveCanvas;
  public file?: RiveFile; 
  public artboard?: Artboard;
  public renderer?: CanvasRenderer;

  public isVisible: Observable<boolean>;

  @Input() set riv(url: RiveOrigin) {
    this.url.next(url);
  }

  @Input('artboard') set name(name: string) {
    this.arboardName.next(name);
  }

  @Input() viewbox = '0 0 100% 100%';
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
      shareReplay({ bufferSize: 1, refCount: true }),
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
        this.renderer = this.rive.makeRenderer(this.canvas, true);
      }),
      switchMap(_ => this.setArtboard()),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }


  ngOnInit() {
    this.onReady().pipe(take(1)).subscribe();
  }

  ngOnDestroy() {
    this.artboard?.delete();
  }

  get ctx(): CanvasRenderingContext2D {
    if (!this._ctx) {
      this._ctx = this.canvas.getContext('2d');
    }
    return this._ctx as CanvasRenderingContext2D;
  }

  private setArtboard() {
    return this.arboardName.pipe(
      tap(() => this.artboard?.delete()), // Remove previous artboard if any
      map(name => name ? this.file?.artboardByName(name) : this.file?.defaultArtboard()),
      tap(artboard => this.artboard = artboard),
      tap(() => this.artboardChange.emit(this.artboard)),
      map(() => true)
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

  draw(instance: LinearAnimationInstance, delta: number, mix: number): void
  draw(instance: StateMachineInstance, delta: number): void
  draw(instance: StateMachineInstance | LinearAnimationInstance, delta: number, mix?: number) {
    if (!this.rive) throw new Error('Could not load rive before registrating instance');
    if (!this.artboard) throw new Error('Could not load artboard before registrating instance');
    if (!this.renderer) throw new Error('Could not load renderer before registrating instance');
    
    // TODO clear
    
    // Move frame
    if (isLinearAnimation(instance)) {
      instance.advance(delta);
      instance.apply(mix ?? 1);
    } else {
      instance.advance(delta);
    }
    this.artboard.advance(delta);
    // Render frame on canvas
    const fit = this.rive.Fit[this.fit];
    const alignment = this.rive.Alignment[this.alignment];
    const box = this.box;
    const bounds = this.artboard.bounds;

    // Align renderer if needed
    this.ctx.restore();
    this.ctx.clearRect(0, 0, this.width as number, this.height as number);
    this.ctx.save();
    this.renderer.align(fit, alignment, box, bounds);

    this.ctx.clearRect(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
    this.artboard.draw(this.renderer);

    // TODO restore
    // TODO flush
  }
}

function isLinearAnimation(instance: StateMachineInstance | LinearAnimationInstance): instance is LinearAnimationInstance {
  return 'didLoop' in instance;
}