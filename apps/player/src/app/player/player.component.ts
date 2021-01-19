import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { files } from '../animations';

@Component({
  selector: 'ng-rive-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent implements OnInit {
  file$ = this.route.paramMap.pipe(
    map(params => params.get('name')),
    map(name => files.find(file => file.name === name))
  );
  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
  }

}
