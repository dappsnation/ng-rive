import { ChangeDetectorRef, Component, Pipe, PipeTransform, TemplateRef, ViewChild } from '@angular/core';
import {  FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Artboard, RiveCanvasDirective } from 'ng-rive';
import { cpuUsage } from 'process';
import type { MediaRecorder } from './type-media-recorder';
interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

function getMimeTypes() {
  if (!('MediaRecorder' in window)) return [];
  const VIDEO_TYPES = [ "webm",  "ogg", "mp4", "x-matroska" ];
  const VIDEO_CODECS = [  "h265", "h.265", "h264", "h.264", "vp9", "vp8", "avc1", "av1", "opus" ];
  const types = [];
  VIDEO_TYPES.forEach((videoType) => {
    const type = `video/${videoType}`;
    VIDEO_CODECS.forEach((codec) => types.push(`${type};codecs:${codec}`));
  });
  return types.filter(type => window['MediaRecorder'].isTypeSupported(type));
}

const extensions = {
  "video/x-matroska": 'mkv',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/ogg': 'ogg',
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
  formats = getMimeTypes();
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
      format: new FormControl(this.formats[0]),
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
    const { name, format } = this.form.get('output').value;
    const [ type ] = format.split(';');
    const extension = extensions[type];
    return `${name}.${extension}`;
  }

  upload(event: DragEvent) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.item(0);
  }

  setArtboard(artboard: Artboard) {
    this.form.get('animations').reset();
    this.animations = new Array(artboard.animationCount()).fill(null).map((_, i) => i);
    this.cdr.markForCheck();
  }

  async record() {
    if (!('MediaRecorder' in window)) return;
    this.revokeUrl();
    this.recording = true;
    const mimeType = this.form.get('output.format').value;
    const [ type ] = mimeType.split(';');
    const recordedChunks = [];
    const url: string = await new Promise((res, rej) => {
      const stream = (this.rivCanvas.canvas as CanvasElement).captureStream(60);
      const options = {
        videoBitsPerSecond: 2_500_000,
        mimeType
      };
      this.recorder = new window['MediaRecorder'](stream, options);

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
      this.recorder.start();
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


@Pipe({ name: 'videoFormat' })
export class VideoFormatPipe implements PipeTransform {
  transform(format: string) {
    const [ type, codec ] = format.split(';');
    const extension = extensions[type];
    return `${extension} (${codec.split(':').pop()})`;
  }
}