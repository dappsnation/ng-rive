import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ng-rive-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  time: number | null = 0;
  constructor() { }

  ngOnInit(): void {
  }

}
