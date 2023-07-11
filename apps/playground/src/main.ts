import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ListenerComponent } from './app/listener/listener.component';
import { ArtboardComponent } from './app/artboard/artboard.component';
import { WorkerComponent } from './app/worker/worker.component';
import { PlayerComponent } from './app/player/player.component';
import { StateMachineComponent } from './app/state-machine/state-machine.component';
import { ResizeComponent } from './app/resize/resize.component';
import { withEnabledBlockingInitialNavigation, provideRouter } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RiveModule } from 'ng-rive';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';

if (environment.production) {
	enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
	bootstrapApplication(AppComponent, {
		providers: [
			importProvidersFrom(BrowserModule.withServerTransition({ appId: 'serverApp' }), ReactiveFormsModule, FormsModule, RiveModule, MatFormFieldModule, MatSelectModule, MatSidenavModule, MatButtonModule, MatListModule, MatToolbarModule, MatSliderModule, MatSlideToggleModule, MatInputModule),
			provideAnimations(),
			provideRouter([
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
					path: 'artboard',
					component: ArtboardComponent,
				},
				{
					path: 'listener',
					component: ListenerComponent,
				},
			], withEnabledBlockingInitialNavigation()),
		]
	})
		.catch((err) => console.error(err));
});
