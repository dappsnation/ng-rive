import { ChangeDetectorRef, Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Artboard, RiveCanvasDirective } from 'ng-rive';
import type { MediaRecorder } from './type-media-recorder';
interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

const mimeTypes = {
  'video/webm': 'video/webm;codecs=H264',
}
@Component({
  selector: 'ng-rive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('download') download: TemplateRef<any>;
  @ViewChild(RiveCanvasDirective) rivCanvas: RiveCanvasDirective;
  animations: number[] = [];
  file?: File;
  snackRef: MatSnackBarRef<any>;
  recorder: MediaRecorder;
  recording = false;
  dragging = false;
  downloadUrl?: SafeUrl;

  form = new FormGroup({
    canvas: new FormGroup({
      width: new FormControl(500),
      height: new FormControl(500),
    }),
    output: new FormGroup({
      name: new FormControl('rive'),
      extension: new FormControl('video/webm'),
    }),
    animations: new FormControl([]),
  });

  constructor(
    private sanitizer: DomSanitizer,
    private snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  get canvas() {
    return this.form.get('canvas')?.value;
  }

  get filename() {
    const { name, extension } = this.form.get('output').value;
    return `${name}.${extension.split('/').pop()}`;
  }

  upload(event: DragEvent) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.item(0);
  }

  setArtboard(artboard: Artboard) {
    this.form.get('animations').reset();
    this.animations = new Array(artboard.animationCount()).fill(null).map((_, i) => i);
    console.log('animations', this.animations);
    this.cdr.markForCheck();
  }

  async record() {
    if (!('MediaRecorder' in window)) return;
    this.revokeUrl();
    this.recording = true;
    const type = this.form.get('output.extension').value;
    const mimeType = mimeTypes[type];
    const recordedChunks = [];
    const url: string = await new Promise((res, rej) => {
      const stream = (this.rivCanvas.canvas as CanvasElement).captureStream(60 /*fps*/);
      this.recorder = new window['MediaRecorder'](stream, { mimeType });

      this.recorder.start();

      this.recorder.ondataavailable = (e) => {
        recordedChunks.push(e.data);
        // after stop data avilable event run one more time
        if (this.recorder.state === 'recording') {
          this.recorder.stop();
        }
      }

      this.recorder.onstop = (e) => {
        const blob = new Blob(recordedChunks, { type });
        const url = URL.createObjectURL(blob);
        res(url);
      }
    });
    this.downloadUrl = this.sanitizer.bypassSecurityTrustUrl(url);
    this.snackRef = this.snackbar.openFromTemplate(this.download);
  }

  stopRecording() {
    this.recorder?.stop();
    this.recording = false;
  }

  revokeUrl() {
    window.URL.revokeObjectURL(this.downloadUrl as string);
    delete this.downloadUrl;
  }
}
