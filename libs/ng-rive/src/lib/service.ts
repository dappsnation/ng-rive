import Rive from 'rive-canvas';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RiveCanvas, File } from './types';


@Injectable({ providedIn: 'root' })
export class RiveService {
  private files: Record<string, File> = {};
  public rive?: RiveCanvas;

  constructor(
    private http: HttpClient
  ) {}

  private async getRive() {
    if (!this.rive) {
      const locateFile = (file: string) => `https://unpkg.com/rive-canvas@latest/${file}`;
      this.rive = await Rive({ locateFile });
    }
    return this.rive;
  }

  async load(url: string) {
    if (!this.files[url]) {
      const asset = `assets/rive/${url}.riv`;
      const [ rive, buffer ] = await Promise.all([
        this.getRive(),
        this.http.get(asset, { responseType: 'arraybuffer' }).toPromise(),
      ]);
      this.files[url] = rive.load(new Uint8Array(buffer));
    }
    return this.files[url];
  }
}