import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconService {
  constructor(
    private registry: MatIconRegistry,
    private sanitizer: DomSanitizer,
  ) {}


  register(name: string) {
    const path = `/assets/mat-icons/${name}.svg`;
    const url = this.sanitizer.bypassSecurityTrustResourceUrl(path);
    this.registry.addSvgIcon(name, url);
  }
}