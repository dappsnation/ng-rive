import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, DocumentSnapshot } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable, of } from 'rxjs';
import { switchMap, map, take, shareReplay } from 'rxjs/operators';

interface FirebaseError {
  code: string;
  message: string;
}

export type User = firebase.User;
export type Snapshot<T> = DocumentSnapshot<T>;
export type UserCredential = firebase.auth.UserCredential;
export type AuthProvider = firebase.auth.AuthProvider;
export type Transaction = firebase.firestore.Transaction;
export type WriteBatch = firebase.firestore.WriteBatch;
export type AtomicWrite = Transaction | WriteBatch;

export interface AuthWriteOptions<Ctx = any> {
  write?: AtomicWrite;
  ctx?: Ctx;
  collection?: null | string
}
export type UpdateCallback<State> = (state: Readonly<State>, tx?: Transaction) => Partial<State>;

export interface FireAuthConfig<Profile> {
  /** Path used for to store the user into firestore */
  path?: string;
  /** The key used to store the id of the document */
  idKey?: string;

  verificationUrl?: string;

  /** Triggered when the profile has been created */
  onCreate?(profile: Profile, options: AuthWriteOptions): any;
  /** Triggered when the profile has been updated */
  onUpdate?(profile: Partial<Profile>, options: AuthWriteOptions): any;
  /** Triggered when the profile has been deleted */
  onDelete?(options: AuthWriteOptions): any;
  /** Triggered when user signin for the first time or signup with email & password */
  onSignup?(credential: UserCredential, options: AuthWriteOptions): any;
  /** Triggered when a user signin, except for the first time @see onSignup */
  onSignin?(credential: UserCredential): any;
  /** Triggered when a user signout */
  onSignout?(): any;
  /** Function triggered when getting data from firestore */
  fromFirestore?(snapshot: Snapshot<Profile>): Profile | undefined
  /** Function triggered when adding/updating data to firestore */
  toFirestore?(user: Partial<Profile>): any
  /** Function triggered when creating or getting a document for the connected user */
  useCollection?(user: User): undefined | null | string | Promise<undefined | null | string>
  /**
   * Function triggered when transforming a user into a profile
   * @param user The user object from FireAuth
   * @param ctx The context given on signup
   */
  createProfile?(user: User, ctx?: any): Promise<Profile> | Profile
}

export const FIRE_AUTH_CONFIG = new InjectionToken<Partial<FireAuthConfig<any>>>('Configuration for the AuthService');
export const FIRE_AUTH_ORIGIN = new InjectionToken<string>('Url of the emulator');


export const authProviders = ['github', 'google', 'microsoft', 'facebook', 'twitter', 'email', 'apple', 'yahoo'] as const;
export type FireProvider = (typeof authProviders)[number];

export function isUpdateCallback<T>(update: UpdateCallback<T> | Partial<T>): update is UpdateCallback<T> {
  return typeof update === 'function';
}

/** Verify if provider is part of the list of Authentication provider provided by Firebase Auth */
export function isFireAuthProvider(provider: any): provider is FireProvider {
  return typeof provider === 'string' && authProviders.includes(provider as any);
}

export function verifyEmail(cred: UserCredential) {
  if (!cred.user?.emailVerified) {
    return cred.user?.sendEmailVerification();
  }
  return;
}


/**
 * Get the custom claims of a user. If no key is provided, return the whole claims object
 * @param user The user object returned by Firebase Auth
 * @param roles Keys of the custom claims inside the claim objet
 */
export async function getCustomClaims<Claims extends Record<string, any>>(user: User, keys?: string | string[]): Promise<Claims> {
  if (!user) return {} as Claims;
  const { claims } = await user.getIdTokenResult();
  if (!keys) return claims as Claims;

  const fields = Array.isArray(keys) ? keys : [keys];
  const result: Record<string, any> = {};
  for (const key of fields) {
    if (claims[key]) {
      result[key] = claims[key];
    }
  }
  return result as Claims;
}

/**
 * Get the Authentication Provider based on its name
 * @param provider string literal representing the name of the provider
 */
export function getAuthProvider(provider: FireProvider) {
  switch (provider) {
    case 'email': return new firebase.auth.EmailAuthProvider();
    case 'facebook': return new firebase.auth.FacebookAuthProvider();
    case 'github': return new firebase.auth.GithubAuthProvider();
    case 'google': return new firebase.auth.GoogleAuthProvider();
    case 'twitter': return new firebase.auth.TwitterAuthProvider();
    case 'microsoft': return new firebase.auth.OAuthProvider('microsoft.com');
    case 'apple': return new firebase.auth.OAuthProvider('apple');
    case 'yahoo': return new firebase.auth.OAuthProvider('yahoo.com');
  }
}

interface AuthState {
  user?: User | null;
}

@Injectable({ providedIn: 'root' })
export class FireAuth<Profile = unknown, Roles extends Record<string, any> = any> {
  private state: AuthState = {};
  protected idKey: string;
  protected path: string | undefined;
  protected verificationUrl: string | undefined;
  
  user = this.auth.authState;
  profile$ = this.user.pipe(
    switchMap(user => this.getDoc({ user })),
    switchMap(doc => doc ? doc.snapshotChanges() : of(undefined)),
    map(snapshot => snapshot?.payload ? this.fromFirestore(snapshot.payload) : undefined),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    protected db: AngularFirestore,
    public auth: AngularFireAuth,
    @Optional() @Inject(FIRE_AUTH_CONFIG) private config?: FireAuthConfig<Profile>,
  ) {
    this.createProfile = config?.createProfile || this.createProfile;
    // Converter
    this.fromFirestore = config?.fromFirestore || this.fromFirestore;
    this.toFirestore = config?.toFirestore || this.toFirestore;
    this.idKey = this.config?.idKey ?? 'id';
    this.path = this.config?.path;
    this.verificationUrl = this.config?.verificationUrl;
  }

  /** Triggered when the profile has been created */
  protected onCreate(profile: Profile, options: AuthWriteOptions): any {
    if (this.config?.onCreate) {
      return this.config.onCreate(profile, options);
    }
  }
  /** Triggered when the profile has been updated */
  protected onUpdate(profile: Partial<Profile>, options: AuthWriteOptions): any {
    if (this.config?.onUpdate) {
      return this.config.onUpdate(profile, options);
    }
  }
  /** Triggered when the profile has been deleted */
  protected onDelete(options: AuthWriteOptions): any {
    if (this.config?.onDelete) {
      return this.config.onDelete(options);
    }
  }
  /** Triggered when user signin for the first time or signup with email & password */
  protected onSignup(credential: UserCredential, options: AuthWriteOptions): any {
    if (this.config?.onSignup) {
      return this.config.onSignup(credential, options);
    }
  }
  /** Triggered when a user signin, except for the first time @see onSignup */
  protected onSignin(credential: UserCredential): any {
    if (this.config?.onSignin) {
      return this.config.onSignin(credential);
    }
  }
  /** Triggered when a user signout */
  protected onSignout(): any {
    if (this.config?.onSignout) {
      return this.config.onSignout();
    }
  }


  /**
   * Select the roles for this user. Can be in custom claims or in a Firestore collection
   * @param user The user given by FireAuth
   * @see getCustomClaims to get the custom claims out of the user
   * @note Can be overwritten
   */
  protected selectRoles(user: User): Promise<Roles> | Observable<Roles> {
    return getCustomClaims<Roles>(user);
  }

  /**
   * Function triggered when getting data from firestore
   * @note should be overwritten
   */
  protected fromFirestore(snapshot: Snapshot<Profile>) {
    if (this.config?.fromFirestore) {
      return this.config.fromFirestore(snapshot);
    }
    // Default
    return snapshot.exists
      ? { ...snapshot.data(), [this.idKey]: snapshot.id } as Profile
      : undefined;
  }

  /**
   * Function triggered when adding/updating data to firestore
   * @note should be overwritten
   */
  protected toFirestore(profile: Partial<Profile>): any {
    if (this.config?.toFirestore) {
      return this.config.toFirestore(profile);
    }
    // Default
    return profile;
  }

  /**
   * Function triggered when transforming a user into a profile
   * @param user The user object from FireAuth
   * @param ctx The context given on signup
   */
  protected createProfile(user: firebase.User, ctx?: any): Promise<Profile> | Profile {
    if (this.config?.createProfile) {
      return this.config.createProfile(user, ctx);
    }
    // Default
    return { avatar: user?.photoURL, displayName: user?.displayName } as any;
  }

  /** Triggerd when creating or getting a user */
  protected useCollection(user: User): undefined | null | string | Promise<undefined | null | string> {
    if (this.config?.useCollection) {
      return this.config.useCollection(user);
    }
    return this.path ?? null;
  }

  /** If user connected, return its document in Firestore,  */
  async getDoc(options: { user?: User | null, collection?: string | null } = {}) {
    const user = options.user ?? await this.getUser();
    if (user) {
      const collection = options.collection
        ? options.collection
        : await this.useCollection(user);
      if (collection) {
        return this.db.collection(collection).doc<Profile>(user.uid);
      }
      return;
    }
    return;
  }

  /** The current sign-in user (or null) */
  async getUser() {
    if (!this.state.user) {
      this.state.user = await this.auth.authState.pipe(take(1)).toPromise();
    }
    return this.state.user;
  }

  /** Get the current user from Firestore */
  async getValue() {
    const doc = await this.getDoc();
    if (doc) {
      const snapshot = await doc.ref.get() as Snapshot<Profile>;
      return this.fromFirestore(snapshot);
    }
    return;
  }

  /**
   * @description Delete user from authentication service and database
   * WARNING This is security sensitive operation
   */
  async delete(options: AuthWriteOptions = {}) {
    const user = await this.getUser();
    const doc = await this.getDoc({ user });
    if (!user || !doc) {
      throw new Error('No user connected');
    }
    const { write = this.db.firestore.batch(), ctx } = options;
    write.delete(doc.ref);
    await this.onDelete({ write, ctx });
    if (!options.write) {
      await (write as WriteBatch).commit();
    }
    return user.delete();
  }

  /** Update the current profile of the authenticated user */
  async update(
    profile: Partial<Profile> | UpdateCallback<Profile>,
    options: AuthWriteOptions = {}
  ) {
    const doc = await this.getDoc();
    if (!doc) {
      throw new Error('No user connected.');
    }
    const ref = doc.ref;
    if (isUpdateCallback(profile)) {
      return this.db.firestore.runTransaction(async tx => {
        const snapshot = await tx.get(ref) as Snapshot<Profile>;
        const doc = this.fromFirestore(snapshot);
        if (!doc) {
          throw new Error(`Could not find document at "${this.path}/${snapshot.id}"`)
        }
        const data = profile(this.toFirestore(doc), tx);
        tx.update(ref, data);
        await this.onUpdate(data, { write: tx, ctx: options.ctx });
        return tx;
      });
    } else if (typeof profile === 'object') {
      const { write = this.db.firestore.batch(), ctx } = options;
      write.update(ref, this.toFirestore(profile));
      await this.onUpdate(profile, { write, ctx });
      // If there is no atomic write provided
      if (!options.write) {
        return (write as WriteBatch).commit();
      }
    }
  }

  /**
   * Create a user based on email and password
   * Will send a verification email to the user if verificationURL is provided config
   */
  async signup(email: string, password: string, options: AuthWriteOptions = {}): Promise<UserCredential> {
    const cred = await this.auth.createUserWithEmailAndPassword(email, password);
    if (this.verificationUrl) {
      await cred.user?.sendEmailVerification({
        url: this.verificationUrl,
      });
    }
    this.state.user = cred.user;
    return this.create(cred, options);
  }

  /** Signin with email & password, provider name, provider objet or custom token */
  // tslint:disable-next-line: unified-signatures
  signin(email: string, password: string, options?: AuthWriteOptions): Promise<UserCredential>;
  signin(authProvider: AuthProvider, options?: AuthWriteOptions): Promise<UserCredential>;
  signin(provider?: FireProvider, options?: AuthWriteOptions): Promise<UserCredential>;
  // tslint:disable-next-line: unified-signatures
  signin(token: string, options?: AuthWriteOptions): Promise<UserCredential>;
  async signin(
    provider?: FireProvider | AuthProvider | string,
    passwordOrOptions?: string | AuthWriteOptions,
    options?: AuthWriteOptions
  ): Promise<UserCredential> {
    let profile;
    try {
      let cred: UserCredential;
      if (!provider) {
        cred = await this.auth.signInAnonymously();
      } else if (passwordOrOptions && typeof provider === 'string' && typeof passwordOrOptions === 'string') {
        cred = await this.auth.signInWithEmailAndPassword(provider, passwordOrOptions);
      } else if (typeof provider === 'object') {
        cred = await this.auth.signInWithPopup(provider);
      } else if (isFireAuthProvider(provider)) {
        const authProvider = getAuthProvider(provider);
        cred = await this.auth.signInWithPopup(authProvider);
      } else {
        cred = await this.auth.signInWithCustomToken(provider);
      }
      const user = cred.user;
      if (!user) {
        throw new Error('Could not find credential for signin');
      }
      // Signup: doesn't trigger onSignin
      if (cred.additionalUserInfo?.isNewUser) {
        options = typeof passwordOrOptions === 'object' ? passwordOrOptions : {};
        return this.create(cred, options);
      }
      
      // Provider
      options = (typeof passwordOrOptions === 'object' ? passwordOrOptions : options) ?? {};
      const { write = this.db.firestore.batch(), ctx, collection } = options;

      const ngDoc = await this.getDoc({ user, collection });
      if (ngDoc) {
        const document = await ngDoc.get().toPromise() as Snapshot<Profile>;
        // Signup with provider
        if (!document.exists) {
          profile = await this.createProfile(user);
          (write as WriteBatch).set(ngDoc!.ref, this.toFirestore(profile));
          await this.onCreate(profile, { write, ctx, collection });
          if (!options.write) {
            await (write as WriteBatch).commit();
          }
        }
      }
      
      await this.onSignin(cred);
      this.state.user = cred.user;
      return cred;
    } catch (err) {
      if ((err as FirebaseError).code === 'auth/operation-not-allowed') {
        console.warn('You tried to connect with a disabled auth provider. Enable it in Firebase console');
      }
      throw err;
    }
  }

  /** Signs out the current user and clear the store */
  async signOut() {
    await this.auth.signOut();
    await this.onSignout();
    this.state.user = null;
  }

  /** Manage the creation of the user into Firestore */
  private async create(cred: UserCredential, options: AuthWriteOptions) {
    const user = cred.user;
    if (!user) {
      throw new Error('Could not create an account');
    }

    const { write = this.db.firestore.batch(), ctx, collection } = options;
    await this.onSignup(cred, { write, ctx, collection });
    this.state.user = user;

    const doc = await this.getDoc({ user, collection })
    if (doc) {
      const profile = await this.createProfile(user, ctx);
      (write as WriteBatch).set(doc.ref, this.toFirestore(profile));
      await this.onCreate(profile, { write, ctx, collection });
      if (!options.write) {
        await (write as WriteBatch).commit();
      }
    }
    return cred;
  }
}