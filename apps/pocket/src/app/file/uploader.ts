import { Directive, HostListener, Input, NgModule } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
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
      const file = files.item(0);
      console.log(file, user);
      if (file && user) {
        const path = `${this.path}/${file.name}`;
        const task = this.storage.upload(path, file);
        const snapshot = await task;
        const url = await snapshot.ref.getDownloadURL();
        this.service.add({ path, url }, { params: { uid: user.uid }});
      }
    }
  }

  constructor(
    private storage: AngularFireStorage,
    private service: RiveFilesService,
    private auth: AuthService,
  ) { }

}


@NgModule({
  declarations: [RiveUploader],
  exports: [RiveUploader],
})
export class RiveUploaderModule {}