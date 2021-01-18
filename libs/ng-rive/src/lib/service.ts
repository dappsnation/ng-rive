// @ts-ignore : should be fixed with https://github.com/rive-app/rive-wasm/pull/12
import Rive from 'rive-canvas';
import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RiveCanvas, File as RiveFile } from './types';

export const RIVE_FOLDER = new InjectionToken<string>('Folder with Rive files');
export const RIVE_VERSION = new InjectionToken<string>('Version used to load rive WASM');

@Injectable({ providedIn: 'root' })
export class RiveService {
  private files: Record<string, RiveFile> = {};
  public rive?: RiveCanvas;

  constructor(
    @Optional() @Inject(RIVE_FOLDER) private folder: string,
    @Optional() @Inject(RIVE_VERSION) private version: string,
    private http: HttpClient
  ) {
    this.folder = folder ?? 'assets/rive';
    this.version = version ?? 'latest';
  }

  private async getRive() {
    if (!this.rive) {
      const locateFile = (file: string) => `https://unpkg.com/rive-canvas@${this.version}/${file}`;
      this.rive = await Rive({ locateFile });
    }
    return this.rive;
  }

  async load(file: string | File) {
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
      this.files[file] = rive.load(new Uint8Array(buffer));
    }
    return this.files[file];
  }
}