import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FireCollection } from '../collection.service';

export interface RiveFile {
  id: string;
  path: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class RiveFilesService extends FireCollection<RiveFile>{
  readonly path = 'profiles/:uid/files';
  constructor(db: AngularFirestore) {
    super(db);
  }
}