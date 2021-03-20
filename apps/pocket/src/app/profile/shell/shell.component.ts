import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../auth/service';
import { RiveFile, RiveFilesService } from '../../file/service';
import { exist } from '../../utils';
import { switchMap, filter } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
  selector: 'profile-shell',
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
    private storage: AngularFireStorage,
    private riveFiles: RiveFilesService,
  ) { }

  remove(file: RiveFile, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    Promise.all([
      this.storage.ref(file.path).delete().toPromise(),
      this.riveFiles.remove(file.id)
    ]);
  }
}
