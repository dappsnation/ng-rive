import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../auth/service';
import { RiveFilesService } from '../../file/service';
import { exist } from '../../utils';
import { switchMap, filter } from 'rxjs/operators';

@Component({
  selector: 'profile-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  profile$ = this.auth.profile$;
  files$ = this.profile$.pipe(
    filter(exist),
    switchMap(profile => this.riveFiles.valueChanges({ uid: profile?.id }))
  );
  constructor(
    private auth: AuthService,
    private riveFiles: RiveFilesService,
  ) { }

}
