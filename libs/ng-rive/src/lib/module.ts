import { NgModule } from '@angular/core';
import { RiveCanvasDirective } from './canvas';
import { RivePlayer } from './player';
import { HttpClientModule } from '@angular/common/http';
import { RiveNode } from './component/node';
import { RiveBone } from './component/bone';
import { RiveRootBone } from './component/root-bone';

@NgModule({
  imports: [HttpClientModule],
  declarations: [RiveCanvasDirective, RivePlayer, RiveNode, RiveBone, RiveRootBone],
  exports: [RiveCanvasDirective, RivePlayer, RiveNode, RiveBone, RiveRootBone],
})
export class RiveModule {}