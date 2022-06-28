import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../auth/service';
import { RiveFile, RiveFilesService } from '../../file/service';
import { exist } from '../../utils';
import { switchMap, filter } from 'rxjs/operators';

@Component({
  selector: 'rive-profile-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  trackById = (i: number, item: {id: string}) => item.id;
  profile$ = this.auth.profile$;
  files$ = this.profile$.pipe(
    filter(exist),
    switchMap(profile => this.riveFiles.valueChanges(ref => ref.where('uid', '==', profile.id))),
  );
  constructor(
    private auth: AuthService,
    private riveFiles: RiveFilesService,
  ) { }


  publish(file: RiveFile) {
    this.riveFiles.update(file.id, { visible: !file.visible });
  }
}
