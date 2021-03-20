import { AngularFirestore, AngularFirestoreCollection, CollectionReference, DocumentChangeAction, DocumentData, DocumentReference, DocumentSnapshot, QueryDocumentSnapshot, QueryFn, QueryGroupFn } from '@angular/fire/firestore';
import { Observable, of, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import type firebase from 'firebase/app';

////////////
// TYEPES //
////////////

export type Firestore = firebase.firestore.Firestore;
export type Reference<E = any> = firebase.firestore.DocumentReference<E>;
export type WriteBatch = firebase.firestore.WriteBatch;
export type Transaction = firebase.firestore.Transaction;
export type AtomicWrite  = WriteBatch | Transaction;
export type Params = Record<string, string>;
export type Timestamp = firebase.firestore.Timestamp;
export interface WriteOptions {
  params?: Params;
  write?: AtomicWrite;
  ctx?: any;
}

export type UpdateCallback<E> = (entity: Readonly<E>, tx?: Transaction) => Partial<E> | Promise<Partial<E>>;
export type ArrayOutput<I, O> = I extends (infer A)[] ? O[] : O;
export type GetRefs<I> =
  I extends (infer A)[] ? DocumentReference[]
  : I extends string ? DocumentReference
  : CollectionReference;

/////////////
// HELPERS //
/////////////

/** Get the params from a path */
export function getPathParams(path: string) {
  return path.split('/')
    .filter(segment => segment.charAt(0) === ':')
    .map(segment => segment.substr(1));
}

/** Return the full path of the doc */
export function getDocPath(path: string, id: string) {
  // If path is smaller than id, id is the full path from ref
  return (path.split('/').length < id.split('/').length)
    ? id
    : `${path}/${id}`;
}

/**
 * Transform a path based on the params
 * @param path The path with params starting with "/:"
 * @param params A map of id params
 * @example pathWithParams('movies/:movieId/stakeholder/:shId', { movieId, shId })
 */
export function pathWithParams(path: string, params: Params): string {
  return path.split('/').map(segment => {
    if (segment.charAt(0) === ':') {
      const key = segment.substr(1);
      return params[key] || segment;
    } else {
      return segment;
    }
  }).join('/');
}

export function assertPath(path: string) {
  for (const segment of path.split('/')) {
    if (segment.charAt(0) === ':') {
      const key = segment.substr(1);
      throw new Error(`Required parameter ${key} from ${path} has not been provided`);
    }
  }
}

/** check is an Atomic write is a transaction */
export function isTransaction(write?: AtomicWrite): write is Transaction {
  return (typeof write === 'object') && ('get' in write);
}

function isNotUndefined<D>(doc: D | undefined): doc is D {
  return doc !== undefined;
}
function isNotNull<D>(doc: D | null): doc is D {
  return doc !== null;
}



/////////////
// SERVICE //
/////////////


export abstract class FireCollection<E extends DocumentData> {
  private memo: Record<string, Observable<E | undefined>> = {};
  protected readonly abstract path: string;
  protected idKey = 'id';
  protected memorize = false;

  protected onCreate?(entity: E, options: WriteOptions): any;
  protected onUpdate?(entity: Partial<E>, options: WriteOptions): any;
  protected onDelete?(id: string, options: WriteOptions): any;

  constructor(protected db: AngularFirestore ) {}

  private fromMemo(path: string, id: string): Observable<E | undefined> {
    if (!this.memo[id]) {
      this.memo[id] = this.db.doc<E>(getDocPath(path, id)).snapshotChanges().pipe(
        map(action => this.fromFirestore(action.payload)),
        shareReplay(1)
      );
    }
    return this.memo[id];
  }

  /** Generate a path for the document or collection based on params */
  protected getPath(params?: Params) {
    return params
      ? pathWithParams(this.path, params)
      : this.path;
  }
  
  /** Function triggered when adding/updating data to firestore */
  protected toFirestore(entity: Partial<E>): any {
    return entity;
  }

  /** Function triggered when getting data from firestore */
  protected fromFirestore(snapshot: DocumentSnapshot<E> | QueryDocumentSnapshot<E>): E | undefined {
    if (snapshot.exists) {
      return { ...snapshot.data() as any, [this.idKey]: snapshot.id };
    } else {
      return undefined;
    }
  }

  protected getMeta() {
    return { lastUpdate: new Date() };
  }


  batch() {
    return this.db.firestore.batch();
  }

  runTransaction(cb: Parameters<Firestore['runTransaction']>[0]) {
    return this.db.firestore.runTransaction(tx => cb(tx));
  }

  /** The Angular Fire collection */
  getCollection(params?: Params): AngularFirestoreCollection<E>
  getCollection(queryFn?: QueryFn): AngularFirestoreCollection<E>
  getCollection(queryOrParams?: Params | QueryFn, queryFn?: QueryFn): AngularFirestoreCollection<E> {
    if (!queryOrParams) {
      return this.db.collection<E>(this.path);
    } else if (typeof queryOrParams === 'function') {
      return this.db.collection<E>(this.path, queryOrParams);
    } else {
      const path = this.getPath(queryOrParams);
      assertPath(path);
      return this.db.collection<E>(path, queryFn);
    }
  }

  /** The angular fire collection group (based on the last collectionId in the path) */
  getCollectionGroup(queryGroupFn?: QueryGroupFn<E>) {
    const collectionId: string = this.path.split('/').pop() as string;
    return this.db.collectionGroup<E>(collectionId, queryGroupFn);
  }


  ///////////////
  // SNAPSHOTS //
  ///////////////

  /** Return the reference of the document(s) or collection */
  public getRef(params?: Params): CollectionReference;
  public getRef(ids?: string[], params?: Params): DocumentReference[];
  public getRef(id?: string, params?: Params): DocumentReference;
  public getRef(
    idOrParams?: string | string[] | Params,
    params: Params = {}
  ): GetRefs<typeof idOrParams> {
    const path = this.getPath(params);
    // If path targets a collection ( odd number of segments after the split )
    if (typeof idOrParams === 'string') {
      return this.db.doc<E>(getDocPath(path, idOrParams)).ref;
    }
    if (Array.isArray(idOrParams)) {
      return idOrParams.map(id => this.db.doc<E>(getDocPath(path, id)).ref);
    } else if (typeof idOrParams === 'object') {
      const subpath = this.getPath(idOrParams);
      assertPath(subpath);
      return this.db.collection<E>(subpath).ref;
    } else {
      assertPath(path);
      return this.db.collection<E>(path, idOrParams).ref;
    }
  }


  /** Return the current value of the path from Firestore */
  public async getValue(params?: Params): Promise<E[]>;
  public async getValue(ids?: string[], params?: Params): Promise<E[]>;
  // tslint:disable-next-line: unified-signatures
  public async getValue(query?: QueryFn, params?: Params): Promise<E[]>;
  public async getValue(id: string, params?: Params): Promise<E | undefined>;
  public async getValue(
    idOrQuery?: string | string[] | QueryFn | Params,
    params: Params = {}
  ): Promise<E | E[] | undefined> {
    if (typeof idOrQuery === 'object' && !Array.isArray(idOrQuery)) {
      params = idOrQuery;
    }
    const path = this.getPath(params);
    // If path targets a collection ( odd number of segments after the split )
    if (typeof idOrQuery === 'string') {
      const snapshot = await this.db.doc<E>(getDocPath(path, idOrQuery)).ref.get();
      return this.fromFirestore(snapshot as DocumentSnapshot<E>);
    }
    let docs: QueryDocumentSnapshot<E>[];
    if (Array.isArray(idOrQuery)) {
      const promises = idOrQuery.map(id => this.db.doc<E>(getDocPath(path, id)).ref.get());
      docs = await Promise.all(promises) as QueryDocumentSnapshot<E>[];
    } else if (typeof idOrQuery === 'function') {
      assertPath(path);
      const { ref } = this.db.collection<E>(path);
      const snaphot = await idOrQuery(ref).get();
      docs = snaphot.docs as QueryDocumentSnapshot<E>[];
    } else if (typeof idOrQuery === 'object') {
      const subpath = this.getPath(idOrQuery);
      assertPath(subpath);
      const snapshot = await this.db.collection(subpath).ref.get();
      docs = snapshot.docs as QueryDocumentSnapshot<E>[];
    } else {
      assertPath(path);
      const snapshot = await this.db.collection(path, idOrQuery).ref.get();
      docs = snapshot.docs as QueryDocumentSnapshot<E>[];
    }
    return docs
      .map(doc => this.fromFirestore(doc))
      .filter(isNotUndefined);
  }


  /** Listen to the change of values of the path from Firestore */
  public valueChanges(params?: Params): Observable<E[]>;
  public valueChanges(ids?: string[], params?: Params): Observable<E[]>;
  // tslint:disable-next-line: unified-signatures
  public valueChanges(query?: QueryFn, params?: Params): Observable<E[]>;
  public valueChanges(id?: string | null, params?: Params): Observable<E | undefined>;
  public valueChanges(
    idOrQuery?: string | string[] | QueryFn | Params | null,
    params: Params = {}
  ): Observable<E | E[] | undefined> {
    if (idOrQuery === null) {
      return of(undefined);
    }
    if (typeof idOrQuery === 'object' && !Array.isArray(idOrQuery)) {
      params = idOrQuery;
    }
    const path = this.getPath(params);
    // If one ID
    if (typeof idOrQuery === 'string') {
      if (this.memorize) {
        return this.fromMemo(path, idOrQuery);
      }
      return this.db.doc<E>(getDocPath(path, idOrQuery)).snapshotChanges().pipe(
        map(action => this.fromFirestore(action.payload))
      );
    }
    // If list of IDs
    if (Array.isArray(idOrQuery)) {
      if (!idOrQuery.length) return of([]);
      if (this.memorize) {
        return combineLatest(idOrQuery.map(id => this.fromMemo(path, id))).pipe(
          map(docs => docs.filter(isNotUndefined))
        );
      }
      const changes = idOrQuery.map(id => this.db.doc<E>(getDocPath(path, id)).snapshotChanges());
      return combineLatest(changes).pipe(
        map(actions => actions.map(action => this.fromFirestore(action.payload))),
        map(docs => docs.filter(isNotUndefined))
      );
    }

    let actions$: Observable<DocumentChangeAction<E>[]>;
    if (typeof idOrQuery === 'function') {
      assertPath(path);
      actions$ = this.db.collection<E>(path, idOrQuery).snapshotChanges();
    } else if (typeof idOrQuery === 'object') {
      const subpath = this.getPath(idOrQuery);
      assertPath(subpath);
      actions$ = this.db.collection<E>(subpath).snapshotChanges();
    } else {
      assertPath(path);
      actions$ = this.db.collection<E>(path, idOrQuery).snapshotChanges();
    }
    return actions$.pipe(
      map(actions => actions.map(action => this.fromFirestore(action.payload.doc))),
      map(docs => docs.filter(isNotUndefined))
    );
  }


  ///////////
  // GROUP //
  ///////////
  public async getGroup(queryFn?: QueryGroupFn<E>) {
    const collectionGroup = this.getCollectionGroup(queryFn);
    const collection = await collectionGroup.get().toPromise();
    const docs = collection.docs as QueryDocumentSnapshot<E>[];
    return docs
      .map(doc => this.fromFirestore(doc))
      .filter(isNotUndefined);
  }

  public groupChanges(queryFn?: QueryGroupFn<E>) {
    const collectionGroup = this.getCollectionGroup(queryFn);
    return collectionGroup.snapshotChanges().pipe(
      map(actions => actions.map(action => this.fromFirestore(action.payload.doc))),
      map(docs => docs.filter(isNotUndefined)),
    );
  }

  ///////////
  // WRITE //
  ///////////
  /**
   * Create or update documents
   * @param documents One or many documents
   * @param options options to write the document on firestore
   */
  upsert(documents: Partial<E>, options?: WriteOptions): Promise<string>
  upsert(documents: Partial<E>[], options?: WriteOptions): Promise<string[]>
  async upsert(
    documents: Partial<E> | Partial<E>[],
    options: WriteOptions = {}
  ): Promise<string | string[]> {
    const doesExist = async (doc: Partial<E>) => {
      const id: string | undefined = doc[this.idKey];
      if (!id) return false;
      const ref = this.getRef(id, options.params);
      const { exists } = await (isTransaction(options?.write) ? options?.write.get(ref) : ref.get());
      return exists;
    };
    if (!Array.isArray(documents)) {
      return (await doesExist(documents))
        ? this.update(documents, options).then(_ => documents[this.idKey] as string)
        : this.add(documents, options);
    }

    const toAdd: Partial<E>[] = [];
    const toUpdate: Partial<E>[] = [];
    for (const doc of documents) {
      (await doesExist(doc))
        ? toUpdate.push(doc)
        : toAdd.push(doc);
    }
    return Promise.all([
      this.add(toAdd, options),
      this.update(toUpdate, options).then(_ => toUpdate.map(doc => doc[this.idKey] as string))
    ]).then(([added, updated]) => added.concat(updated) as any);
  }

  /**
   * Add a document or a list of document to Firestore
   * @param docs A document or a list of document
   * @param options options to write the document on firestore
   */
  add(documents: Partial<E>, options?: WriteOptions): Promise<string>
  add(documents: Partial<E>[], options?: WriteOptions): Promise<string[]>
  async add(
    documents: Partial<E> | Partial<E>[],
    options: WriteOptions = {}
  ): Promise<string | string[]> {
    const docs = Array.isArray(documents) ? documents : [documents];
    const { write = this.batch(), ctx } = options;
    const path = this.getPath(options.params);
    const _meta = await this.getMeta();
    const operations = docs.map(async doc => {
      const id = doc[this.idKey] || this.db.createId();
      const result = this.toFirestore({ ...doc, [this.idKey]: id });
      const { ref } = this.db.doc(getDocPath(path, id));
      const data = {...result, _meta};
      (write as WriteBatch).set(ref, (data));
      if (this.onCreate) {
        await this.onCreate(data, { write, ctx });
      }
      return id;
    });
    const ids: string[] = await Promise.all(operations);
    // If there is no atomic write provided
    if (!options.write) {
      await (write as WriteBatch).commit();
    }
    return Array.isArray(documents) ? ids : ids[0];
  }

  /**
   * Remove one or several document from Firestore
   * @param id A unique or list of id representing the document
   * @param options options to write the document on firestore
   */
  async remove(id: string | string[], options: WriteOptions = {}) {
    const { write = this.batch(), ctx } = options;
    const path = this.getPath(options.params);
    const ids: string[] = Array.isArray(id) ? id : [id];

    const operations = ids.map(async docId => {
      const { ref } = this.db.doc(getDocPath(path, docId));
      write.delete(ref);
      if (this.onDelete) {
        await this.onDelete(docId, { write, ctx });
      }
    });
    await Promise.all(operations);
    // If there is no atomic write provided
    if (!options.write) {
      return (write as WriteBatch).commit();
    }
  }

  /** Remove all document of the collection */
  async removeAll(options: WriteOptions = {}) {
    const path = this.getPath(options.params);
    assertPath(path);
    const snapshot = await this.db.collection(path).ref.get();
    const ids = snapshot.docs.map(doc => doc.id);
    return this.remove(ids, options);
  }

  /**
   * Update one or several document in Firestore
   */
  update(entity: Partial<E> | Partial<E>[], options?: WriteOptions): Promise<void>;
  update(id: string | string[], entityChanges: Partial<E>, options?: WriteOptions): Promise<void>;
  update(ids: string | string[], stateFunction: UpdateCallback<E>, options?: WriteOptions): Promise<Transaction[]>;
  async update(
    idsOrEntity: Partial<E> | Partial<E>[] | string | string[],
    stateFnOrWrite?: UpdateCallback<E> | Partial<E> | WriteOptions,
    options: WriteOptions = {}
  ): Promise<void | Transaction[]> {

    let ids: string[] = [];
    let stateFunction: UpdateCallback<E> | undefined;
    let getData: (docId: string) => Partial<E>;

    const isEntity = (value: DocumentData | string): value is Partial<E> => {
      return typeof value === 'object' && value[this.idKey];
    };
    const isEntityArray = (values: DocumentData | string[] | string): values is Partial<E>[] => {
      return Array.isArray(values) && values.every(value => isEntity(value));
    };

    const _meta = await this.getMeta();
    if (isEntity(idsOrEntity)) {
      ids = [idsOrEntity[this.idKey] as string];
      getData = () => idsOrEntity;
      options = stateFnOrWrite as WriteOptions || {};
    } else if (isEntityArray(idsOrEntity)) {
      const entityMap = new Map(idsOrEntity.map(entity => [entity[this.idKey] as string, entity]));
      ids = Array.from(entityMap.keys());
      getData = docId => entityMap.get(docId)!;
      options = stateFnOrWrite as WriteOptions || {};
    } else if (typeof stateFnOrWrite === 'function') {
      ids = Array.isArray(idsOrEntity) ? idsOrEntity : [idsOrEntity];
      stateFunction = stateFnOrWrite as UpdateCallback<E>;
    } else if (typeof stateFnOrWrite === 'object') {
      ids = Array.isArray(idsOrEntity) ? idsOrEntity : [idsOrEntity];
      getData = () => stateFnOrWrite as Partial<E>;
    } else {
      throw new Error('Passed parameters match none of the function signatures.');
    }

    const { ctx } = options;
    const path = this.getPath(options.params);

    if (!Array.isArray(ids) || !ids.length) {
      return;
    }

    // If update depends on the entity, use transaction
    if (stateFunction) {
      return this.db.firestore.runTransaction(async tx => {
        const operations = ids.map(async id => {
          const { ref } = this.db.doc(getDocPath(path, id));
          const snapshot = (await tx.get(ref)) as QueryDocumentSnapshot<E>;
          const doc = this.fromFirestore(snapshot);
          if (doc && stateFunction) {
            const result = await stateFunction(Object.freeze(doc), tx);
            const data = { ...result, _meta };
            tx.update(ref, this.toFirestore(data));
            if (this.onUpdate) {
              await this.onUpdate(data, { write: tx, ctx });
            }
          }
          return tx;
        });
        return Promise.all(operations);
      });
    } else {
      const { write = this.batch() } = options;
      const operations = ids.map(async docId => {
        const doc = Object.freeze(getData(docId));
        if (!docId) {
          throw new Error(`Document should have an unique id to be updated, but none was found in ${doc}`);
        }
        const { ref } = this.db.doc(getDocPath(path, docId));
        const data = { ...doc, _meta };
        write.update(ref, this.toFirestore(data));
        if (this.onUpdate) {
          await this.onUpdate(data, { write, ctx });
        }
      });
      await Promise.all(operations);
      // If there is no atomic write provided
      if (!options.write) {
        return (write as WriteBatch).commit();
      }
      return;
    }
  }

}
