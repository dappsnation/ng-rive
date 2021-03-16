import { NgModule } from '@angular/core';
import { RiveCanvasDirective } from './canvas';
import { RivePlayer } from './player';
import { RiveAnimationDirective } from './animation';
import { HttpClientModule } from '@angular/common/http';
import { RiveNode } from './component/node';
import { RiveBone } from './component/bone';
import { RiveRootBone } from './component/root-bone';

@NgModule({
  imports: [HttpClientModule],
  declarations: [RiveCanvasDirective, RiveAnimationDirective, RivePlayer, RiveNode, RiveBone, RiveRootBone],
  exports: [RiveCanvasDirective, RiveAnimationDirective, RivePlayer, RiveNode, RiveBone, RiveRootBone],
})
export class RiveModule {}