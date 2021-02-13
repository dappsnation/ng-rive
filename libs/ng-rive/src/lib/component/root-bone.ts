import { Directive, Input, NgZone } from '@angular/core';
import { RiveCanvasDirective } from '../canvas';
import { RiveTransformComponent } from './transform-component';
import { RootBone } from 'rive-canvas';


@Directive({
  selector: 'riv-root-bone, [rivRootBone]',
  exportAs: 'rivRootBone'
})
export class RiveRootBone extends RiveTransformComponent<RootBone> {
  @Input() set x(value: number | string | null | undefined) {
    this.set('x', value);
  }

  @Input() set y(value: number | string | null | undefined) {
    this.set('y', value);
  }

  @Input() set length(value: number | string | null | undefined) {
    this.set('length', value);
  }

  constructor(zone: NgZone, canvas: RiveCanvasDirective) {
    super(zone, canvas);
  }

  getComponent(name: string) {
    return this.canvas.artboard?.rootBone(name);
  }

}