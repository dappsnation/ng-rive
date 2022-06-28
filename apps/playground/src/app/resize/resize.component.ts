import { Component } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Artboard } from 'rive-canvas';
import { startWith } from 'rxjs/operators';

const fits = ['cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none', 'scaleDown'];
const alignments = ['center', 'topLeft', 'topCenter', 'topRight', 'centerLeft', 'centerRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];

@Component({
  selector: 'ng-rive-resize',
  templateUrl: './resize.component.html',
  styleUrls: ['./resize.component.scss']
})
export class ResizeComponent {
  form = new UntypedFormGroup({
    width: new UntypedFormControl(400),
    height: new UntypedFormControl(400),
    fit: new UntypedFormControl('contain'),
    alignment: new UntypedFormControl('center'),
  })
  value$ = this.form.valueChanges.pipe(startWith(this.form.value));
  fits = fits;
  alignments = alignments;

  update(artboard: Artboard) {
    const width = artboard.bounds.maxX - artboard.bounds.minX;
    const height = artboard.bounds.maxY - artboard.bounds.minY;
    this.form.patchValue({ width, height });
  }
}
