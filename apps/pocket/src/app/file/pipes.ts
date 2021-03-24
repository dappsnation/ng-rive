import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filename' })
export class FilenamePipe implements PipeTransform {
  transform(path?: string) {
    if (!path) return '';
    return path.split('/').pop() as string;
  }
}

@NgModule({
  declarations: [FilenamePipe],
  exports: [FilenamePipe],
})
export class RiveFilePipeModule {}