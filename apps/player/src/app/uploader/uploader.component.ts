import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Service } from '../service';

type State = 'idle' | 'hover' | 'uploading' | 'selected';

@Component({
  selector: 'ng-rive-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploaderComponent {
  state = new BehaviorSubject<State>('idle');

  @HostListener('dragover', ['$event'])
  onDragOver($event: DragEvent) {
    $event.preventDefault();
    this.state.next('hover');
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave($event: DragEvent) {
    $event.preventDefault();
    this.state.next('idle');
  }

  @HostListener('drop', ['$event'])
  async onDrop($event: DragEvent) {
    $event.preventDefault();
    const file = $event.dataTransfer?.files.item(0);
    this.setFile(file);
    this.state.next('idle');
  }

  constructor(
    private service: Service,
    private router: Router,
    private snackbar: MatSnackBar
  ) { }
    
  file(event: Event) {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.item(0));
  }

  setFile(file?: File | null) {
    if (file) {
      const segments = file.name.split('.');
      const extension = segments.pop();
      if (extension !== 'riv') {
        this.snackbar.open(`Expected .riv file. Received: got ${file.name}`, 'X', { duration: 1500 });
        return;
      }
      const name = segments.join('.');
      this.service.files[name] = file;
      this.router.navigate([name]);
    }
  }

}
