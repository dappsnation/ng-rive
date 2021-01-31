import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
// import { RiveCanvas } from './canvas.directive';
import { RiveModule } from 'ng-rive';

@NgModule({
  declarations: [
    AppComponent,
    // RiveCanvas
  ],
  imports: [
    BrowserModule,
    RiveModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
