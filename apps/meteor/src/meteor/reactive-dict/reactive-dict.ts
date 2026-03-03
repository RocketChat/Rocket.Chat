import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';
import { Reload } from 'meteor/reload';

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Serializes values to ensure consistent storage and comparison.
 */
function stringify(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }
  return EJSON.stringify(value);
}

/**
 * Parses serialized values back to their original form.
 */
function parse(serialized: string | undefined): any {
  if (serialized === undefined || serialized === 'undefined') {
    return undefined;
  }
  return EJSON.parse(serialized);
}

function changed(v?: Tracker.Dependency): void {
  if (v) {
    v.changed();
  }
}

/**
 * Global registry for Hot Code Push migrations.
 */
const migratedDictData: Record<string, Record<string, string>> = {};
const dictsToMigrate: Record<string, ReactiveDict<any>> = {};

// Initialize migration data if Reload is available in the environment
try {
  const migrationData = Reload._migrationData('reactive-dict') as { dicts?: Record<string, Record<string, string>> } | undefined;
  if (migrationData && migrationData.dicts) {
    Object.assign(migratedDictData, migrationData.dicts);
  }

  Reload._onMigrate('reactive-dict', () => {
    const dataToMigrate: Record<string, Record<string, string>> = {};

    for (const dictName in dictsToMigrate) {
      if (hasOwn.call(dictsToMigrate, dictName)) {
        dataToMigrate[dictName] = dictsToMigrate[dictName]._getMigrationData();
      }
    }

    return [true, { dicts: dataToMigrate }];
  });
} catch (e) {
  // If 'meteor/reload' is not available in a pure modern stack, fail silently.
}

export class ReactiveDict<O extends Record<string, any> = any> {
  private keys: Record<string, string> = {};
  private name?: string;
  private allDeps: Tracker.Dependency = new Tracker.Dependency();
  private keyDeps: Record<string, Tracker.Dependency> = {};
  private keyValueDeps: Record<string, Record<string, Tracker.Dependency>> = {};

  // 1. Overload for passing just a string name
  constructor(dictName: string);
  // 2. Overload for passing a string name AND initial data
  constructor(dictName: string | undefined, initialValue: Partial<O>);
  // 3. Overload for passing just initial data (no name)
  constructor(initialValue: Partial<O>);
  // 4. Overload for empty instantiation
  constructor();
  /**
  * Constructor for a ReactiveDict, which represents a reactive dictionary of key/value pairs.
  * @param dictName When a name is passed, preserves contents across Hot Code Pushes
  * @param initialValue The default values for the dictionary
  */
  constructor(dictNameOrInitialValue?: string | Partial<O> | undefined, initialValue?: Partial<O>) {

    if (dictNameOrInitialValue) {
      if (typeof dictNameOrInitialValue === 'string') {
        const dictName = dictNameOrInitialValue;
        if (hasOwn.call(dictsToMigrate, dictName)) {
          throw new Error(`Duplicate ReactiveDict name: ${dictName}`);
        }

        dictsToMigrate[dictName] = this;

        if (hasOwn.call(migratedDictData, dictName)) {
          this.keys = migratedDictData[dictName];
          delete migratedDictData[dictName];
        } else {
          this._setObject(initialValue || {});
        }
        this.name = dictName;
      } else if (typeof dictNameOrInitialValue === 'object') {
        this._setObject(dictNameOrInitialValue as Partial<O>);
      } else {
        throw new Error(`Invalid ReactiveDict argument: ${String(dictNameOrInitialValue)}`);
      }
    } else if (typeof initialValue === 'object') {
      this._setObject(initialValue);
    }
  }

  public set<P extends keyof O>(key: P, value?: O[P]): void;
  public set(object: Partial<O>): void;
  public set(keyOrObject: keyof O | Partial<O>, value?: any): void {
    if (typeof keyOrObject === 'object' && value === undefined) {
      this._setObject(keyOrObject as Partial<O>);
      return;
    }

    const key = String(keyOrObject);
    const serializedValue = stringify(value);

    const keyExisted = hasOwn.call(this.keys, key);
    const oldSerializedValue = keyExisted ? this.keys[key] : 'undefined';
    const isNewValue = serializedValue !== oldSerializedValue;

    this.keys[key] = serializedValue;

    if (isNewValue || !keyExisted) {
      changed(this.allDeps);
    }

    if (isNewValue && this.keyDeps) {
      changed(this.keyDeps[key]);
      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldSerializedValue]);
        changed(this.keyValueDeps[key][serializedValue]);
      }
    }
  }

  public setDefault<P extends keyof O>(key: P, value?: O[P]): void;
  public setDefault(object: Partial<O>): void;
  public setDefault(keyOrObject: keyof O | Partial<O>, value?: any): void {
    if (typeof keyOrObject === 'object' && value === undefined) {
      this._setDefaultObject(keyOrObject as Partial<O>);
      return;
    }

    const key = String(keyOrObject);
    if (!hasOwn.call(this.keys, key)) {
      this.set(keyOrObject as keyof O, value);
    }
  }

  public get<P extends keyof O>(key: P): O[P] | undefined {
    const stringKey = String(key);
    this._ensureKey(stringKey);
    this.keyDeps[stringKey].depend();
    return parse(this.keys[stringKey]);
  }

  public equals<P extends keyof O>(key: P, value: string | number | boolean | undefined | null | Date | any): boolean {
    // Duck type check for Mongo.ObjectID to avoid relying on the global `Package` object
    const isObjectID = value && typeof value === 'object' && typeof value.toHexString === 'function';

    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean' &&
      typeof value !== 'undefined' &&
      !(value instanceof Date) &&
      !isObjectID &&
      value !== null
    ) {
      throw new Error("ReactiveDict.equals: value must be scalar");
    }

    const stringKey = String(key);
    const serializedValue = stringify(value);

    if (Tracker.active) {
      this._ensureKey(stringKey);

      if (!hasOwn.call(this.keyValueDeps[stringKey], serializedValue)) {
        this.keyValueDeps[stringKey][serializedValue] = new Tracker.Dependency();
      }

      const isNew = this.keyValueDeps[stringKey][serializedValue].depend();

      if (isNew) {
        Tracker.onInvalidate(() => {
          // clean up [key][serializedValue] if it's now empty, avoiding O(n) memory leaks
          if (!this.keyValueDeps[stringKey][serializedValue].hasDependents()) {
            delete this.keyValueDeps[stringKey][serializedValue];
          }
        });
      }
    }

    let oldValue: any = undefined;
    if (hasOwn.call(this.keys, stringKey)) {
      oldValue = parse(this.keys[stringKey]);
    }

    return EJSON.equals(oldValue, value);
  }

  public all(): Partial<O> {
    this.allDeps.depend();
    const ret: Partial<O> = {};
    Object.keys(this.keys).forEach((key) => {
      (ret as any)[key] = parse(this.keys[key]);
    });
    return ret;
  }

  public clear(): void {
    const oldKeys = this.keys;
    this.keys = {};

    this.allDeps.changed();

    Object.keys(oldKeys).forEach((key) => {
      changed(this.keyDeps[key]);
      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldKeys[key]]);
        changed(this.keyValueDeps[key]['undefined']);
      }
    });
  }

  public delete<P extends keyof O>(key: P): boolean {
    const stringKey = String(key);
    let didRemove = false;

    if (hasOwn.call(this.keys, stringKey)) {
      const oldValue = this.keys[stringKey];
      delete this.keys[stringKey];

      changed(this.keyDeps[stringKey]);
      if (this.keyValueDeps[stringKey]) {
        changed(this.keyValueDeps[stringKey][oldValue]);
        changed(this.keyValueDeps[stringKey]['undefined']);
      }

      this.allDeps.changed();
      didRemove = true;
    }
    return didRemove;
  }

  public destroy(): void {
    this.clear();
    if (this.name && hasOwn.call(dictsToMigrate, this.name)) {
      delete dictsToMigrate[this.name];
    }
  }

  private _setObject(object: Partial<O>): void {
    Object.keys(object).forEach((key) => {
      this.set(key as keyof O, (object as any)[key]);
    });
  }

  private _setDefaultObject(object: Partial<O>): void {
    Object.keys(object).forEach((key) => {
      this.setDefault(key as keyof O, (object as any)[key]);
    });
  }

  private _ensureKey(key: string): void {
    if (!(key in this.keyDeps)) {
      this.keyDeps[key] = new Tracker.Dependency();
      this.keyValueDeps[key] = {};
    }
  }

  public _getMigrationData(): Record<string, string> {
    return this.keys;
  }
}