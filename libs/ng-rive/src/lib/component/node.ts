import { Directive, Input, NgZone } from '@angular/core';
import { RiveCanvas } from '../canvas';
import { RiveTransformComponent } from './transform-component';
import { Node } from '@rive-app/canvas-advanced';

@Directive({
    selector: 'riv-node, [rivNode]',
    exportAs: 'rivNode',
    standalone: true
})
export class RiveNode extends RiveTransformComponent<Node> {
  @Input()
  set x(value: number | string | null | undefined) {
    this.set('x', value);
  }
  get x() {
    return this.component?.x;
  }

  @Input()
  set y(value: number | string | null | undefined) {
    this.set('y', value);
  }
  get y() {
    return this.component?.y;
  }

  constructor(zone: NgZone, canvas: RiveCanvas) {
    super(zone, canvas);
  }

  getComponent(name: string) {
    return this.canvas.artboard?.node(name);
  }

}