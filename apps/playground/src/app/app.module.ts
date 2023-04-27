import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { RiveModule } from 'ng-rive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { ResizeComponent } from './resize/resize.component';
import { StateMachineComponent } from './state-machine/state-machine.component';
import { PlayerComponent } from './player/player.component';
import { WorkerComponent } from './worker/worker.component';
import { MultipleComponent } from './multiple/multiple.component';
import { ArtboardComponent } from './artboard/artboard.component';
import { ListenerComponent } from './listener/listener.component';

@NgModule({
  declarations: [
    AppComponent,
    ResizeComponent,
    StateMachineComponent,
    PlayerComponent,
    WorkerComponent,
    MultipleComponent,
    ArtboardComponent,
    ListenerComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    RiveModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSidenavModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatInputModule,
    RouterModule.forRoot(
      [
        {
          path: '',
          redirectTo: 'state-machine',
          pathMatch: 'full',
        },
        {
          path: 'resize',
          component: ResizeComponent,
        },
        {
          path: 'state-machine',
          component: StateMachineComponent,
        },
        {
          path: 'player',
          component: PlayerComponent,
        },
        {
          path: 'worker',
          component: WorkerComponent,
        },
        {
          path: 'multiple',
          component: MultipleComponent,
        },
        {
          path: 'artboard',
          component: ArtboardComponent,
        },
        {
          path: 'listener',
          component: ListenerComponent,
        },
      ],
      {
        initialNavigation: 'enabledBlocking',
      }
    ),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
