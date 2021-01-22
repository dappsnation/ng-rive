import { ChangeDetectionStrategy, Component } from '@angular/core';
import { files } from './animations';

@Component({
  selector: 'ng-rive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  files = files;
}
