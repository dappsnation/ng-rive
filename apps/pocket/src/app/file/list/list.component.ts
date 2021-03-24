import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RiveFilesService } from '../service';

@Component({
  selector: 'files-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent {
  trackById = (i: number, item: {id: string}) => item.id;
  files$ = this.service.valueChanges(ref => ref.where('visible', '==', true));
  constructor(private service: RiveFilesService) { }
}
