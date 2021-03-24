import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './list.component';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RiveCardModule } from '../card/card.module';


@NgModule({
  declarations: [ListComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    RiveCardModule,
    RouterModule.forChild([{ path: '', component: ListComponent }])
  ]
})
export class ListModule { }
