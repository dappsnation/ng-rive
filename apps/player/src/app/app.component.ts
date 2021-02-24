import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Service } from './service';

@Component({
  selector: 'ng-rive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  files = this.service.files;

  constructor(private service: Service) {}
}
