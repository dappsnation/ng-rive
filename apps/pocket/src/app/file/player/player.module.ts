import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { RiveModule } from 'ng-rive';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { RouterModule } from '@angular/router';
import { PlayerComponent } from './player.component';
import { RiveFilePipeModule } from '../pipes';

@NgModule({
  declarations: [PlayerComponent],
  imports: [
    CommonModule,
    RiveModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    FormsModule,
    RiveFilePipeModule,
    ClipboardModule,
    RouterModule.forChild([{ path: '', component: PlayerComponent }])
  ]
})
export class PlayerModule { }
