import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FireCollection } from '../collection.service';

export interface RiveFile {
  id: string;
  path: string;
  url: string;
  uid: string;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class RiveFilesService extends FireCollection<RiveFile>{
  readonly path = 'files';
  createId = () => this.db.createId();
  constructor(db: AngularFirestore) {
    super(db);
  }
}