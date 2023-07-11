import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
    selector: 'ng-rive-worker',
    templateUrl: './worker.component.html',
    styleUrls: ['./worker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class WorkerComponent implements AfterViewInit {

  @ViewChild('el') el!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    const el = this.el.nativeElement;
    const canvas = el.transferControlToOffscreen();
    /** Do not put the URL in a variable, it breaks */
    const worker = new Worker(new URL('../offscreen.worker', import.meta.url), { type: 'module' });
    const url = 'assets/rive/poison-loader.riv';
    const version = 'latest';
    const animations = ['idle'];
    worker.postMessage({ canvas, url, version, animations }, [canvas]);
  }

}
