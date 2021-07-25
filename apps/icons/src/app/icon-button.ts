import { CommonModule } from '@angular/common';
import { Component, ContentChild, Directive, HostListener, Input, NgModule, ViewChild } from '@angular/core';
import { RiveModule, RiveSMInput } from 'ng-rive';


@Component({
  selector: 'riv-icon',
  template: `
    <canvas width="48" height="48" riv="icons">
      <riv-state-machine *ngIf="name" [name]="name" play>
        <riv-input name="click"></riv-input>
      </riv-state-machine>
    </canvas>
  `,
  styles: [`
    :host, canvas {
      width: 24px;
      height: 24px;
    }
  `]
})
export class RiveIcon {
  @ViewChild(RiveSMInput) input?: RiveSMInput;
  @Input() name?: string;
}

@Directive({
  selector: 'button[riv-icon-button], a[riv-icon-button]',
})
export class RiveIconButton {
  @ContentChild(RiveIcon) icon?: RiveIcon;
  @HostListener('click') onclick(){
    this.icon?.input?.fire();
  }
}


@NgModule({
  declarations: [RiveIcon, RiveIconButton],
  exports: [RiveIcon, RiveIconButton],
  imports: [CommonModule, RiveModule],
})
export class RiveIconModule {}