import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RiveCanvas, RiveStateMachine, RiveSMInput } from 'ng-rive';


export interface BottomTabItem {
  id: string;
  stateMachine: string;
  artboard: string;
  status: boolean;
  show: boolean;
}

export const tabItemsList: BottomTabItem[] = [
  {
    id: 'tab_chat',
    stateMachine: 'CHAT_Interactivity',
    artboard: 'CHAT',
    status: false,
    show: false,
  },
  {
    id: 'tab_search',
    stateMachine: 'SEARCH_Interactivity',
    artboard: 'SEARCH',
    status: false,
    show: false,
  },
  {
    id: 'tab_timer',
    stateMachine: 'TIMER_Interactivity',
    artboard: 'TIMER',
    status: false,
    show: false,
  },
  {
    id: 'tab_bell',
    stateMachine: 'BELL_Interactivity',
    artboard: 'BELL',
    status: false,
    show: false,
  },
  {
    id: 'tab_user',
    stateMachine: 'USER_Interactivity',
    artboard: 'USER',
    status: false,
    show: false,
  },
];

@Component({
    selector: 'ng-rive-artboard',
    templateUrl: './artboard.component.html',
    styleUrls: ['./artboard.component.scss'],
    standalone: true,
    imports: [
        RiveCanvas,
        RiveStateMachine,
        RiveSMInput,
        NgFor,
    ],
})
export class ArtboardComponent {
  tabs = tabItemsList;
  trackById = (_: number, tab: BottomTabItem) => tab.id;
}
