import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShellComponent } from './shell.component';
import { RiveUploaderModule } from '../../file/uploader'
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RiveCardModule } from '../../file/card/card.module';

@NgModule({
  declarations: [ShellComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RiveUploaderModule,
    RiveCardModule,
    MatSlideToggleModule,
    RouterModule.forChild([{
      path: '',
      component: ShellComponent,
    }])
  ]
})
export class ShellModule { }
