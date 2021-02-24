import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Service {
  files: Record<string, File> = {};
}