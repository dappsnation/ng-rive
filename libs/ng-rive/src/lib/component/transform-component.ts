import { Directive, Input, NgZone } from '@angular/core';
import { RiveCanvasDirective } from '../canvas';
import { TransformComponent } from 'rive-canvas';

@Directive()
export abstract class RiveTransformComponent<T extends TransformComponent> {
  protected component?: T;
  protected state: Partial<T> = {};

  @Input() set name(name: string) {
    if (typeof name !== 'string') return;
    this.canvas.onReady().subscribe(() => {
      this.component = this.getComponent(name);
      if (!this.component) throw new Error(`Could not find component with name: "${name}"`);
      for (const key in this.state) {
        this.component[key as keyof T] = this.state[key as keyof T] as any;
      }
    });
  }

  @Input() set scale(value: string | null | undefined) {
    this.set('scaleX', value);
    this.set('scaleY', value);
  }

  @Input() set scaleX(value: number | string | null | undefined) {
    this.set('scaleX', value);
  }

  @Input() set scaleY(value: number | string | null | undefined) {
    this.set('scaleX', value);
  }

  @Input() set rotation(value: number | string | null | undefined) {
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (v) {
      const rotation = Math.abs(v) > (2 * Math.PI) ? (v * (Math.PI/180)) : v;
      this.set('rotation', rotation);
    }
  }

  constructor(
    private zone: NgZone,
    protected canvas: RiveCanvasDirective
  ) {}

  abstract getComponent(name: string): T | undefined;

  protected set(key: keyof T, value: number | string | null | undefined) {
    this.zone.runOutsideAngular(() => {
      const v = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof v === 'number') {
        if (this.component) this.component[key] = v as any;
        else this.state[key] = v as any;
      }
    });
  }
}