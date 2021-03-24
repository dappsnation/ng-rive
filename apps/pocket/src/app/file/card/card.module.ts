import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from './card.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { RiveModule } from 'ng-rive';
import { UtilsPipeModule } from '../../utils';

@NgModule({
  declarations: [CardComponent],
  exports: [CardComponent],
  imports: [
    CommonModule,
    RouterModule,
    RiveModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatRippleModule,
    ClipboardModule,
    UtilsPipeModule
  ]
})
export class RiveCardModule { }
