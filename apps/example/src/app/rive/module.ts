import { NgModule } from '@angular/core';
import { RiveDirective, RivePlayer } from './directive';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule],
  declarations: [RiveDirective, RivePlayer],
  exports: [RiveDirective, RivePlayer],
})
export class RiveModule {}