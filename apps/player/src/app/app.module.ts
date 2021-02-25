import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { RiveModule, RIVE_VERSION } from 'ng-rive';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { PlayerComponent } from './player/player.component';
import { UploaderComponent } from './uploader/uploader.component';

@NgModule({
  declarations: [AppComponent, PlayerComponent, UploaderComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RiveModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    FormsModule,
    RouterModule.forRoot([{
      path: '',
      component: UploaderComponent
    }, {
      path: ':name',
      component: PlayerComponent
    }])
  ],
  providers: [{
    provide: RIVE_VERSION,
    useValue: '0.6.10'
  }],
  bootstrap: [AppComponent],
})
export class AppModule {}
