import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RiveCanvas } from './canvas.directive';

@NgModule({
  declarations: [
    AppComponent,
    RiveCanvas
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
