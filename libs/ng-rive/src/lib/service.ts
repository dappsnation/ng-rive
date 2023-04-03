import Rive from '@rive-app/canvas-advanced';
import { RiveCanvas, File as RiveFile } from '@rive-app/canvas-advanced';
import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { animationFrame } from './frame';
import { share } from 'rxjs/operators';
import { RIVE_FOLDER, RIVE_VERSION, RIVE_WASM } from './tokens';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class RiveService {
  private counters: Record<string, number> = {};
  private files: Record<string, RiveFile> = {};
  public rive?: RiveCanvas;
  public frame?: Observable<number>;

  constructor(
    @Optional() @Inject(RIVE_FOLDER) private folder: string,
    @Optional() @Inject(RIVE_VERSION) private version: string,
    @Optional() @Inject(RIVE_WASM) private localwasmPath: string,
    private http: HttpClient
  ) {
    this.folder = folder ?? 'assets/rive';
    this.version = version ?? 'latest';
    this.wasmPath = localwasmPath ?? `https://unpkg.com/@rive-app/canvas-advanced@${this.version}/rive.wasm`;
  }

  private async getRive() {
    if (!this.rive) {
      const locateFile = () => this.wasmPath;
      this.rive = await Rive({ locateFile });
      this.frame = animationFrame(this.rive).pipe(share());
    }
    return this.rive;
  }

  private getAsset(asset: string) {
    return firstValueFrom(this.http.get(asset, { responseType: 'arraybuffer' }));
  }

  /** Load a riv file */
  async load(file: string | File | Blob) {
    // Provide the file directly
    if (typeof file !== 'string') {
      const [ rive, buffer ] = await Promise.all([
        this.getRive(),
        file.arrayBuffer(),
      ]);
      return rive?.load(new Uint8Array(buffer));
    }

    const asset = `${this.folder}/${file}.riv`;
    const [ rive, buffer ] = await Promise.all([
      this.getRive(),
      this.getAsset(asset),
    ]);
    if (!rive) throw new Error('Could not load rive');
    return rive.load(new Uint8Array(buffer));
  }

}
