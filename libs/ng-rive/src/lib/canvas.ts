import { Directive, ElementRef, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { Observable, Subscription, ReplaySubject, from } from 'rxjs';
import { filter, shareReplay, switchMap, take } from 'rxjs/operators';
import { RiveService } from './service';
import { Artboard, CanvasRenderer, LinearAnimationInstance, RiveCanvas, File as RiveFile } from './types';

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
  private subs: Subscription[] = [];
  private loaded?: Promise<boolean>;
  public ctx: CanvasRenderingContext2D;
  public renderer?: CanvasRenderer;
  public rive?: RiveCanvas;
  public file?: RiveFile; 
  public canvas: HTMLCanvasElement;
  public artboard?: Artboard;

  private animations: Record<string, LinearAnimationInstance> = {};

  public isVisible: Observable<boolean>;
  // public frame = animationFrame.pipe(share());

  @Input('riv') set riv(url: string | File) {
    this.url.next(url);
  }

  @Input('artboard') private artboardName?: string;
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
  }

  get isLazy() {
    return this.lazy === true || this.lazy === '';
  }

  get count() {
    return this.artboard?.animationCount();
  }

  ngOnInit() {
    if (!this.isLazy) this.load();
  }

  // Load the file
  private load() {
    if (!this.loaded) {
      this.loaded = new Promise(async (res, rej) => {
        const url = await this.url.pipe(take(1)).toPromise();
        this.file = await this.service.load(url);
        this.rive = this.service.rive;
        if (!this.rive) throw new Error('Service could not load rive');

        this.renderer = new this.rive.CanvasRenderer(this.ctx);
        this.artboard = this.artboardName
          ? this.file?.artboard(this.artboardName)
          : this.file?.defaultArtboard();
        this.artboardChange.emit(this.artboard);
        res(true);
      });
    }
    return this.loaded;
  }


  onReady() {
    if (this.isLazy) {
      return this.isVisible.pipe(
        filter(visible => !!visible),
        take(1),
        switchMap(() => this.load())
      );
    }
    return from(this.load());
  }

}

