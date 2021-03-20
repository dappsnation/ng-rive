import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'apps/pocket/src/environments/environment';
import { Artboard } from 'rive-canvas';
import { ReplaySubject, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/service';
import { RiveFile, RiveFilesService } from '../service';

@Component({
  selector: 'rive-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  hover$ = new BehaviorSubject<boolean>(false);
  animation$ = new BehaviorSubject<string>('');
  users$ = this.auth.user;

  @Input() file?: RiveFile;

  @HostListener('mouseenter') enter() {
    this.hover$.next(true);
  }
  @HostListener('mouseleave') leave() {
    this.hover$.next(false);
  }

  constructor(
    private auth: AuthService,
    private service: RiveFilesService,
    private storage: AngularFireStorage,
    private clipboard: Clipboard,
    private snackbar: MatSnackBar
  ) { }


  setArtboard(artboard: Artboard) {
    this.animation$.next(artboard.animationAt(0).name);
  }

  copy() {
    if (!this.file) return;
    this.clipboard.copy(`${environment.baseUrl}/player/${this.file.id}`);
    this.snackbar.open('Link copied 🎈', '', { duration: 1500 });
  }

  async remove() {
    const user = await this.auth.getUser();
    if (!user || !this.file || user.uid !== this.file.uid) return;
    Promise.all([
      this.service.remove(this.file.id),
      this.storage.ref(this.file.path).delete().toPromise()
    ]);
  }
}
