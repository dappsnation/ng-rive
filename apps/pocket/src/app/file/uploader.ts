import { Component, Directive, HostListener, Inject, Input, NgModule } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/service';
import { RiveFilesService } from './service';

@Directive({
  selector: '[rivUploader]',
  exportAs: 'rivUploader',
  host: {
    'style.position': 'relative'
  }
})
export class RiveUploader {
  @Input('rivUploader') path: string = '';
  
  @HostListener('dragover', ['$event'])
  onDragOver($event: DragEvent) {
    $event.preventDefault();
  }
  
  @HostListener('dragleave', ['$event'])
  onDragLeave($event: DragEvent) {
    $event.preventDefault();
  }
  
  @HostListener('drop', ['$event'])
  async onDrop($event: DragEvent) {
    $event.preventDefault();
    this.upload($event.dataTransfer?.files);
  }
  
  async upload(files?: FileList | null) {
    if (files) {
      const user = await this.auth.getUser();
      if (!user) return;
      const isRive = (file: File) => file.name.split('.').pop() === 'riv';
      const uploadFile = async (file: File) => {
        const path = `${this.path}/${file.name}`;
        const ref = this.storage.ref(path);
        try {
          const meta = await ref.getMetadata().toPromise();
          const confirmed = await this.snackbar.openFromComponent(UploadConfirm, { data: file.name })
            .afterDismissed()
            .toPromise();
          if (!confirmed.dismissedByAction) return;
          await ref.put(file, { customMetadata: meta.customMetadata });
          const url = await ref.getDownloadURL().toPromise();
          return this.service.update(meta.customMetadata.fileId, { url });
        } catch (err) {
          const fileId = this.service.createId();
          await ref.put(file, { customMetadata: { fileId } });
          const url = await ref.getDownloadURL().toPromise();
          return this.service.upsert({ id: fileId, path, url, uid: user.uid, visible: false });
        }
      }
      Promise.all(Array.from(files).filter(isRive).map(uploadFile))
    }
  }

  constructor(
    private storage: AngularFireStorage,
    private service: RiveFilesService,
    private auth: AuthService,
    private snackbar: MatSnackBar
  ) { }

}

@Component({
  selector: 'upload-confirm',
  template: `
    <span>{{ name }} already exists</span>
    <div>
      <button mat-button (click)="ref.dismiss()">Cancel</button>
      <button mat-flat-button color="primary" (click)="ref.dismissWithAction()">Update</button>
  </div>
  `,
  styles: [
    ':host {display: flex; justify-content: space-between; align-items: center}',
    'div {display: flex; align-items: center}'
  ]
})
export class UploadConfirm {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public name: string,
    public ref: MatSnackBarRef<UploadConfirm>,
  ) {}
}


@NgModule({
  declarations: [RiveUploader, UploadConfirm],
  exports: [RiveUploader],
  imports: [MatSnackBarModule, MatButtonModule]
})
export class RiveUploaderModule {}