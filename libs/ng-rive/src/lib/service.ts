import RiveBuilder from '@rive-app/canvas-advanced';
import { RiveCanvas as Rive } from '@rive-app/canvas-advanced';
import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { animationFrame } from './frame';
import { share } from 'rxjs/operators';
import { RIVE_FOLDER, RIVE_VERSION, RIVE_WASM } from './tokens';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RiveService {
  private wasmPath: string;
  private folder: string;
  public rive?: Rive;
  public frame?: Observable<number>;

  constructor(
    private http: HttpClient,
    @Optional() @Inject(RIVE_FOLDER) folder?: string,
    @Optional() @Inject(RIVE_WASM) wasmPath?: string,
    @Optional() @Inject(RIVE_VERSION) version?: string,
  ) {
    const riveVersion = version ?? '2.4.0';
    this.folder = folder ?? 'assets/rive';
    this.wasmPath = wasmPath ?? `https://unpkg.com/@rive-app/canvas-advanced@${riveVersion}/rive.wasm`;
  }

  private async getRive() {
    if (!this.rive) {
      const locateFile = () => this.wasmPath;
      this.rive = await RiveBuilder({ locateFile });
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
