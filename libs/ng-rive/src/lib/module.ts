import { NgModule } from '@angular/core';
import { RiveCanvasDirective } from './canvas';
import { RivePlayer } from './player';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule],
  declarations: [RiveCanvasDirective, RivePlayer],
  exports: [RiveCanvasDirective, RivePlayer],
})
export class RiveModule {}