import Rive from '@rive-app/canvas-advanced';
import { RiveCanvas, File as RiveFile } from '@rive-app/canvas-advanced';
import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { animationFrame } from './frame';
import { share } from 'rxjs/operators';
import { RIVE_FOLDER, RIVE_VERSION } from './tokens';

@Injectable()
export class RiveService {
  private files: Record<string, RiveFile> = {};
  public rive?: RiveCanvas;
  public frame = animationFrame.pipe(share());

  constructor(
    @Optional() @Inject(RIVE_FOLDER) private folder: string,
    @Optional() @Inject(RIVE_VERSION) private version: string,
    private http: HttpClient
  ) {
    this.folder = folder ?? 'assets/rive';
    this.version = version ?? '1.0.67';
  }

  private async getRive() {
    if (!this.rive) {
      const locateFile = () => `https://unpkg.com/@rive-app/canvas-advanced@${this.version}/rive.wasm`;
      this.rive = await Rive({ locateFile });
    }
    return this.rive;
  }

  async load(file: string | File | Blob) {
    if (typeof file !== 'string') {
      const [ rive, buffer ] = await Promise.all([
        this.getRive(),
        file.arrayBuffer(),
      ]);
      return rive?.load(new Uint8Array(buffer));
    }
    if (!this.files[file]) {
      const asset = `${this.folder}/${file}.riv`;
      const [ rive, buffer ] = await Promise.all([
        this.getRive(),
        this.http.get(asset, { responseType: 'arraybuffer' }).toPromise(),
      ]);
      if (!rive) throw new Error('Could not load rive');
      this.files[file] = await rive.load(new Uint8Array(buffer));
    }
    return this.files[file];
  }
}