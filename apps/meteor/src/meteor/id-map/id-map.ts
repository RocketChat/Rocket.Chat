import { EJSON } from 'meteor/ejson';

export type Stringifier<K> = (id: K) => string;
export type Parser<K> = (str: string) => K;
export type IteratorCallback<K, V> = (value: V, id: K) => boolean | void;
export type AsyncIteratorCallback<K, V> = (value: V, id: K) => Promise<boolean | void>;

export class IdMap<K = any, V = any> {
  private _map: Map<string, V>;
  private _idStringify: Stringifier<K>;
  private _idParse: Parser<K>;

  constructor(idStringify?: Stringifier<K>, idParse?: Parser<K>) {
    this._map = new Map<string, V>();
    // Cast fallback JSON methods to avoid type mismatch on arbitrary K signatures
    this._idStringify = idStringify || (JSON.stringify as unknown as Stringifier<K>);
    this._idParse = idParse || (JSON.parse as unknown as Parser<K>);
  }

  // Some of these methods are designed to match methods on OrderedDict, since
  // (eg) ObserveMultiplex and _CachingChangeObserver use them interchangeably.

  public get(id: K): V | undefined {
    const key = this._idStringify(id);
    return this._map.get(key);
  }

  public set(id: K, value: V): void {
    const key = this._idStringify(id);
    this._map.set(key, value);
  }

  public remove(id: K): void {
    const key = this._idStringify(id);
    this._map.delete(key);
  }

  public has(id: K): boolean {
    const key = this._idStringify(id);
    return this._map.has(key);
  }

  public empty(): boolean {
    return this._map.size === 0;
  }

  public clear(): void {
    this._map.clear();
  }

  /**
   * Iterates over the items in the map. Return `false` to break the loop.
   */
  public forEach(iterator: IteratorCallback<K, V>): void {
    for (const [key, value] of this._map) {
      const breakIfFalse = iterator(value, this._idParse(key));
      if (breakIfFalse === false) {
        return;
      }
    }
  }

  /**
   * Asynchronously iterates over the items in the map. Return `false` to break the loop.
   */
  public async forEachAsync(iterator: AsyncIteratorCallback<K, V>): Promise<void> {
    for (const [key, value] of this._map) {
      const breakIfFalse = await iterator(value, this._idParse(key));
      if (breakIfFalse === false) {
        return;
      }
    }
  }

  public size(): number {
    return this._map.size;
  }

  public setDefault(id: K, def: V): V {
    const key = this._idStringify(id);
    if (this._map.has(key)) {
      return this._map.get(key)!;
    }
    this._map.set(key, def);
    return def;
  }

  /**
   * Assumes that values are EJSON-cloneable, and that we don't need to clone
   * IDs (ie, that nobody is going to mutate an ObjectId).
   */
  public clone(): IdMap<K, V> {
    const clone = new IdMap<K, V>(this._idStringify, this._idParse);
    // Copy directly to avoid stringify/parse overhead during construction
    this._map.forEach((value, key) => {
      clone._map.set(key, EJSON.clone(value));
    });
    return clone;
  }
}