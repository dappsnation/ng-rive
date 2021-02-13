import { Directive, Input, NgZone } from '@angular/core';
import { RiveCanvasDirective } from '../canvas';
import { RiveTransformComponent } from './transform-component';
import { Node } from 'rive-canvas';


@Directive({
  selector: 'riv-node, [rivNode]',
  exportAs: 'rivNode'
})
export class RiveNode extends RiveTransformComponent<Node> {
  @Input() set x(value: number | string | null | undefined) {
    this.set('x', value);
  }

  @Input() set y(value: number | string | null | undefined) {
    this.set('y', value);
  }


  constructor(zone: NgZone, canvas: RiveCanvasDirective) {
    super(zone, canvas);
  }

  getComponent(name: string) {
    return this.canvas.artboard?.node(name);
  }

}