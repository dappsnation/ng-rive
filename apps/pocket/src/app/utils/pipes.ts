import { HttpClient } from '@angular/common/http';
import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'http' })
export class HttpPipe implements PipeTransform {
  constructor(private http: HttpClient) {}
  transform(url: string, responseType: 'blob') {
    return this.http.get(url, { responseType })
  }
}

@NgModule({
  declarations: [HttpPipe],
  exports: [HttpPipe],
})
export class UtilsPipeModule {}