import { makeLookupFunction, expandArraysInBranches, compareValues, Matcher } from './matcher.ts';

export type SortSpecifier =
  | Record<string, 1 | -1>
  | Array<string | [string, 'asc' | 'desc']>
  | ((a: any, b: any) => number);

type SortSpecPart = {
  path: string;
  ascending: boolean;
  lookup: (doc: any, arrayIndices?: any[]) => any[];
};

export type SorterOptions = {
  distances?: Map<string, number>;
};

// Given an array of comparators (functions (a,b)->(negative or positive or zero)),
// returns a single comparator which uses each comparator in order and returns the first non-zero value.
function composeComparators(comparatorArray: Array<(a: any, b: any) => number>) {
  return (a: any, b: any) => {
    for (let i = 0; i < comparatorArray.length; ++i) {
      const compare = comparatorArray[i](a, b);
      if (compare !== 0) return compare;
    }
    return 0;
  };
}

export class Sorter {
  private _sortSpecParts: SortSpecPart[] = [];
  private _sortFunction: ((a: any, b: any) => number) | null = null;
  private _keyComparator: (key1: any[], key2: any[]) => number;
  
  // Note: Only necessary if tracking exact modifier effects reactively in high-efficiency loops
  public _selectorForAffectedByModifier?: Matcher;

  constructor(spec: SortSpecifier, options: { affectedByModifier?: boolean } = {}) {
    const addSpecPart = (path: string, ascending: boolean) => {
      if (!path) throw new Error('sort keys must be non-empty');
      if (path.charAt(0) === '$') throw new Error(`unsupported sort key: ${path}`);

      this._sortSpecParts.push({
        ascending,
        lookup: makeLookupFunction(path, { forSort: true }),
        path,
      });
    };

    if (Array.isArray(spec)) {
      spec.forEach(element => {
        if (typeof element === 'string') {
          addSpecPart(element, true);
        } else {
          addSpecPart(element[0], element[1] !== 'desc');
        }
      });
    } else if (typeof spec === 'object' && spec !== null) {
      Object.keys(spec).forEach(key => {
        addSpecPart(key, (spec as Record<string, number>)[key] >= 0);
      });
    } else if (typeof spec === 'function') {
      this._sortFunction = spec;
    } else {
      throw new Error(`Bad sort specification: ${JSON.stringify(spec)}`);
    }

    if (this._sortFunction) {
      this._keyComparator = () => 0;
      return;
    }

    if (options.affectedByModifier) {
      const selector: Record<string, number> = {};
      this._sortSpecParts.forEach(specPart => {
        selector[specPart.path] = 1;
      });
      this._selectorForAffectedByModifier = new Matcher(selector);
    }

    this._keyComparator = composeComparators(
      this._sortSpecParts.map((_, i) => this._keyFieldComparator(i))
    );
  }

  getComparator(options?: SorterOptions) {
    // If sort is specified or have no distances, just use the comparator from
    // the source specification (which defaults to "everything is equal").
    // sort effectively overrides $near
    if (this._sortSpecParts.length || !options || !options.distances) {
      return this._getBaseComparator();
    }

    const distances = options.distances;

    // Return a comparator which compares using $near distances.
    return (a: any, b: any) => {
      if (!distances.has(a._id)) throw new Error(`Missing distance for ${a._id}`);
      if (!distances.has(b._id)) throw new Error(`Missing distance for ${b._id}`);
      return distances.get(a._id)! - distances.get(b._id)!;
    };
  }

  private _compareKeys(key1: any[], key2: any[]): number {
    if (key1.length !== this._sortSpecParts.length || key2.length !== this._sortSpecParts.length) {
      throw new Error('Key has wrong length');
    }
    return this._keyComparator(key1, key2);
  }

  private _generateKeysFromDoc(doc: any, cb: (key: any[]) => void) {
    if (this._sortSpecParts.length === 0) {
      throw new Error("can't generate keys without a spec");
    }

    const pathFromIndices = (indices: any[]) => `${indices.join(',')},`;
    let knownPaths: Record<string, boolean> | null = null;

    const valuesByIndexAndPath = this._sortSpecParts.map(spec => {
      let branches = expandArraysInBranches(spec.lookup(doc), true);

      if (!branches.length) {
        branches = [{ value: undefined }];
      }

      const element: Record<string, any> = Object.create(null);
      let usedPaths = false;

      branches.forEach(branch => {
        if (!branch.arrayIndices) {
          if (branches.length > 1) {
            throw new Error('multiple branches but no array used?');
          }
          element[''] = branch.value;
          return;
        }

        usedPaths = true;
        const path = pathFromIndices(branch.arrayIndices);

        if (Object.prototype.hasOwnProperty.call(element, path)) {
          throw new Error(`duplicate path: ${path}`);
        }

        element[path] = branch.value;

        if (knownPaths && !Object.prototype.hasOwnProperty.call(knownPaths, path)) {
          throw new Error('cannot index parallel arrays');
        }
      });

      if (knownPaths) {
        if (!Object.prototype.hasOwnProperty.call(element, '') &&
            Object.keys(knownPaths).length !== Object.keys(element).length) {
          throw new Error('cannot index parallel arrays!');
        }
      } else if (usedPaths) {
        knownPaths = {};
        Object.keys(element).forEach(path => {
          knownPaths![path] = true;
        });
      }

      return element;
    });

    if (!knownPaths) {
      const soleKey = valuesByIndexAndPath.map(values => {
        if (!Object.prototype.hasOwnProperty.call(values, '')) {
          throw new Error('no value in sole key case?');
        }
        return values[''];
      });
      cb(soleKey);
      return;
    }

    Object.keys(knownPaths).forEach(path => {
      const key = valuesByIndexAndPath.map(values => {
        if (Object.prototype.hasOwnProperty.call(values, '')) {
          return values[''];
        }
        if (!Object.prototype.hasOwnProperty.call(values, path)) {
          throw new Error('missing path?');
        }
        return values[path];
      });
      cb(key);
    });
  }

  private _getBaseComparator() {
    if (this._sortFunction) {
      return this._sortFunction;
    }

    if (!this._sortSpecParts.length) {
      return () => 0;
    }

    return (doc1: any, doc2: any) => {
      const key1 = this._getMinKeyFromDoc(doc1);
      const key2 = this._getMinKeyFromDoc(doc2);
      if (!key1 || !key2) return 0;
      return this._compareKeys(key1, key2);
    };
  }

  private _getMinKeyFromDoc(doc: any): any[] | null {
    let minKey: any[] | null = null;

    this._generateKeysFromDoc(doc, key => {
      if (minKey === null) {
        minKey = key;
        return;
      }
      if (this._compareKeys(key, minKey) < 0) {
        minKey = key;
      }
    });

    return minKey;
  }

  public getPaths(): string[] {
    return this._sortSpecParts.map(part => part.path);
  }

  private _keyFieldComparator(i: number) {
    const invert = !this._sortSpecParts[i].ascending;

    return (key1: any[], key2: any[]) => {
      const compare = compareValues(key1[i], key2[i]);
      return invert ? -compare : compare;
    };
  }
}