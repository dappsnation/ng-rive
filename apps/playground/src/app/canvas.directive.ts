import { Directive, ElementRef, Input } from '@angular/core';

@Directive({ selector: 'canvas [riv]' })
export class RiveCanvas {
  @Input() riv: string = '';

  constructor(private el: ElementRef<HTMLCanvasElement>) {}

  ngOnInit() {
    const url = `assets/rive/${this.riv}.riv`;
    const animations = ['idle'];
    const canvas = this.el.nativeElement.transferControlToOffscreen();
    const worker = new Worker('./rive.worker', { type: 'module'});
    worker.postMessage({ canvas, url, animations }, [canvas]);
  }
}
