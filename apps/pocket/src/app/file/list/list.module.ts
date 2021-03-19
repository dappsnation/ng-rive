import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './list.component';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [ListComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule.forChild([{ path: '', component: ListComponent }])
  ]
})
export class ListModule { }
