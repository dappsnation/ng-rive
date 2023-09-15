import { Component } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { Artboard } from '@rive-app/canvas-advanced';
import { startWith } from 'rxjs/operators';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RivePlayer, RiveCanvas } from 'ng-rive';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

const fits = ['cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none', 'scaleDown'];
const alignments = ['center', 'topLeft', 'topCenter', 'topRight', 'centerLeft', 'centerRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];

@Component({
    selector: 'ng-rive-resize',
    templateUrl: './resize.component.html',
    styleUrls: ['./resize.component.scss'],
    standalone: true,
    imports: [NgIf, RiveCanvas, RivePlayer, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, NgFor, MatOptionModule, AsyncPipe]
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
