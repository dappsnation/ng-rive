import { NgModule } from '@angular/core';
import { RiveCanvas } from './canvas';
import { RivePlayer } from './player';
import { RiveLinearAnimation } from './animation';
import { HttpClientModule } from '@angular/common/http';
import { RiveNode } from './component/node';
import { RiveBone } from './component/bone';
import { RiveRootBone } from './component/root-bone';
import { RiveService } from './service';
import { RiveSMInput, RiveStateMachine } from './state-machine';

@NgModule({
    imports: [HttpClientModule, RiveCanvas, RiveLinearAnimation, RivePlayer, RiveNode, RiveBone, RiveRootBone, RiveSMInput, RiveStateMachine],
    exports: [RiveCanvas, RiveLinearAnimation, RivePlayer, RiveNode, RiveBone, RiveRootBone, RiveSMInput, RiveStateMachine],
    providers: [RiveService]
})
export class RiveModule {}