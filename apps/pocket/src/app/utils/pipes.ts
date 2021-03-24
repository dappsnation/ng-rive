import { HttpClient } from '@angular/common/http';
import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'getBlob' })
export class GetBlobPipe implements PipeTransform {
  constructor(private http: HttpClient) {}
  transform(url?: string) {
    if (!url) return;
    return this.http.get(url, { responseType: 'blob' })
  }
}

@NgModule({
  declarations: [GetBlobPipe],
  exports: [GetBlobPipe],
})
export class UtilsPipeModule {}