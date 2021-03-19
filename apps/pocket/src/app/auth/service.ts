import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { FireAuth, User } from '../auth.service';
import { Profile } from '../profile/service';

export const errorCode = [
  'internal-error',
  'invalid-email',
  'invalid-password',
  'user-not-found',
  'email-already-in-use',
  'wrong-password',
  'weak-password',
  'unconfirmed'
];

@Injectable({ providedIn: 'root' })
export class AuthService extends FireAuth<Profile> {
  readonly path = 'profiles';

  constructor(
    db: AngularFirestore,
    auth: AngularFireAuth,
  ) {
    super(db, auth);
  }

  createProfile(user: User): Profile {
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
    }
  }
}
