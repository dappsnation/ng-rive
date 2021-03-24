import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FireCollection } from '../collection.service';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService extends FireCollection<Profile>{
  readonly path = 'profiles';
  constructor(db: AngularFirestore) {
    super(db);
  }
}