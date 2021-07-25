import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RiveModule } from 'ng-rive';
import { AppComponent } from './app.component';
import { RiveIconModule } from './icon-button';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, RiveModule, RiveIconModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
