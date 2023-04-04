import { InjectionToken } from '@angular/core';

export const RIVE_FOLDER = new InjectionToken<string>('Folder with Rive files');
export const RIVE_VERSION = new InjectionToken<string>('Version used to load rive WASM');
export const RIVE_WASM = new InjectionToken<string>('Local path to rive WASM');
