import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { PreloadAllModules, RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule, USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { AngularFirestoreModule, USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { environment } from '../environments/environment';

// Specific config for emulators
const FIREBASE_EMUTLATORS = environment.useEmulator ? [
  { provide: USE_AUTH_EMULATOR, useValue: ['localhost', 9099] },
  { provide: USE_FIRESTORE_EMULATOR, useValue: ['localhost', 8080] },
] : [];


@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase, 'rive-pocket'),
    AngularFirestoreModule.enablePersistence({ synchronizeTabs: true }),
    AngularFireAuthModule,
    AngularFireStorageModule,
    RouterModule.forRoot([{
      path: '',
      loadChildren: () => import('./file/list/list.module').then(m => m.ListModule)
    },{
      path: 'player/:fileId',
      loadChildren: () => import('./file/player/player.module').then(m => m.PlayerModule)
    }, {
      path: 'auth',
      loadChildren: () => import('./auth/signin/signin.module').then(m => m.SigninModule)
    }, {
      path: 'profile',
      loadChildren: () => import('./profile/shell/shell.module').then(m => m.ShellModule)
    }], {
      initialNavigation: 'enabled',
      paramsInheritanceStrategy: 'always',
      relativeLinkResolution: 'corrected',
      preloadingStrategy: PreloadAllModules
    }),
    BrowserAnimationsModule,
  ],
  providers: [...FIREBASE_EMUTLATORS],
  bootstrap: [AppComponent],
})
export class AppModule {}
