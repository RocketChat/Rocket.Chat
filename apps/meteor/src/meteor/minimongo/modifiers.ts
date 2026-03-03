import { isEqual, isIndexable, isNumericKey, isOperatorObject, Matcher } from './matcher.ts';
import { Sorter } from './sorter.ts';

export type ModifyOptions = {
  isInsert?: boolean;
  arrayIndices?: number[];
};

const NO_CREATE_MODIFIERS: Record<string, boolean> = {
  $pop: true,
  $pull: true,
  $pullAll: true,
  $rename: true,
  $unset: true
};

const invalidCharMsg: Record<string, string> = {
  $: "start with '$'",
  '.': "contain '.'",
  '\0': "contain null bytes"
};

function assertIsValidFieldName(key: string) {
  const match = key.match(/^\$|\.|\0/);
  if (match) {
    throw new Error(`Key ${key} must not ${invalidCharMsg[match[0]]}`);
  }
}

function assertHasValidFieldNames(doc: any) {
  if (doc && typeof doc === 'object') {
    // We use JSON.stringify as a quick way to traverse all keys in the object
    JSON.stringify(doc, (key, value) => {
      assertIsValidFieldName(key);
      return value;
    });
  }
}

function findModTarget(doc: any, keyparts: (string | number)[], options: { noCreate?: boolean; forbidArray?: boolean; arrayIndices?: number[] | undefined } = {}) {
  let usedArrayIndex = false;

  for (let i = 0; i < keyparts.length; i++) {
    const last = i === keyparts.length - 1;
    let keypart = keyparts[i];

    if (!isIndexable(doc)) {
      if (options.noCreate) return undefined;
      throw new Error(`cannot use the part '${keypart}' to traverse ${doc}`);
    }

    if (Array.isArray(doc)) {
      if (options.forbidArray) return null;

      if (keypart === '$') {
        if (usedArrayIndex) throw new Error("Too many positional (i.e. '$') elements");
        if (!options.arrayIndices || !options.arrayIndices.length) {
          throw new Error("The positional operator did not find the match needed from the query");
        }
        keypart = options.arrayIndices[0];
        usedArrayIndex = true;
      } else if (typeof keypart === 'string' && isNumericKey(keypart)) {
        keypart = parseInt(keypart, 10);
      } else {
        if (options.noCreate) return undefined;
        throw new Error(`can't append to array using string field name [${keypart}]`);
      }

      if (last) keyparts[i] = keypart;

      if (options.noCreate && keypart >= doc.length) return undefined;

      while (doc.length < (keypart as number)) {
        doc.push(null);
      }

      if (!last) {
        if (doc.length === keypart) doc.push({});
        else if (typeof doc[keypart as number] !== 'object') {
          throw new Error(`can't modify field '${keyparts[i + 1]}' of list value ${JSON.stringify(doc[keypart as number])}`);
        }
      }
    } else {
      assertIsValidFieldName(keypart as string);
      if (!(keypart in doc)) {
        if (options.noCreate) return undefined;
        if (!last) doc[keypart as string] = {};
      }
    }

    if (last) return doc;
    doc = doc[keypart as string | number];
  }
}

const MODIFIERS: Record<string, Function> = {
  $currentDate(target: any, field: string, arg: any) {
    if (typeof arg === 'object' && arg.$type) {
      if (arg.$type !== 'date') throw new Error('Minimongo does currently only support the date type in $currentDate modifiers');
    } else if (arg !== true) {
      throw new Error('Invalid $currentDate modifier');
    }
    target[field] = new Date();
  },
  $inc(target: any, field: string, arg: any) {
    if (typeof arg !== 'number') throw new Error('Modifier $inc allowed for numbers only');
    if (field in target) {
      if (typeof target[field] !== 'number') throw new Error('Cannot apply $inc modifier to non-number');
      target[field] += arg;
    } else {
      target[field] = arg;
    }
  },
  $min(target: any, field: string, arg: any) {
    if (typeof arg !== 'number') throw new Error('Modifier $min allowed for numbers only');
    if (field in target) {
      if (typeof target[field] !== 'number') throw new Error('Cannot apply $min modifier to non-number');
      if (target[field] > arg) target[field] = arg;
    } else {
      target[field] = arg;
    }
  },
  $max(target: any, field: string, arg: any) {
    if (typeof arg !== 'number') throw new Error('Modifier $max allowed for numbers only');
    if (field in target) {
      if (typeof target[field] !== 'number') throw new Error('Cannot apply $max modifier to non-number');
      if (target[field] < arg) target[field] = arg;
    } else {
      target[field] = arg;
    }
  },
  $mul(target: any, field: string, arg: any) {
    if (typeof arg !== 'number') throw new Error('Modifier $mul allowed for numbers only');
    if (field in target) {
      if (typeof target[field] !== 'number') throw new Error('Cannot apply $mul modifier to non-number');
      target[field] *= arg;
    } else {
      target[field] = 0;
    }
  },
  $rename(target: any, field: string, arg: any, keypath: string, doc: any) {
    if (keypath === arg) throw new Error('$rename source must differ from target');
    if (target === null) throw new Error('$rename source field invalid');
    if (typeof arg !== 'string') throw new Error('$rename target must be a string');
    if (arg.includes('\0')) throw new Error("The 'to' field for $rename cannot contain an embedded null byte");
    if (target === undefined) return;

    const object = target[field];
    delete target[field];

    const keyparts = arg.split('.');
    const target2 = findModTarget(doc, keyparts, { forbidArray: true });
    if (target2 === null) throw new Error('$rename target field invalid');
    target2[keyparts.pop() as string] = object;
  },
  $set(target: any, field: string, arg: any) {
    if (typeof target !== 'object' || target === null) throw new Error('Cannot set property on non-object field');
    assertHasValidFieldNames(arg);
    target[field] = arg;
  },
  $setOnInsert() {
    // Converted to `$set` in `modify`
  },
  $unset(target: any, field: string) {
    if (target !== undefined) {
      if (Array.isArray(target)) {
        if (field in target) target[field as any] = null;
      } else {
        delete target[field];
      }
    }
  },
  $push(target: any, field: string, arg: any) {
    if (target[field] === undefined) target[field] = [];
    if (!Array.isArray(target[field])) throw new Error('Cannot apply $push modifier to non-array');

    if (!(arg && arg.$each)) {
      assertHasValidFieldNames(arg);
      target[field].push(arg);
      return;
    }

    const toPush = arg.$each;
    if (!Array.isArray(toPush)) throw new Error('$each must be an array');
    assertHasValidFieldNames(toPush);

    let position: number | undefined = undefined;
    if ('$position' in arg) {
      if (typeof arg.$position !== 'number') throw new Error('$position must be a numeric value');
      if (arg.$position < 0) throw new Error('$position in $push must be zero or positive');
      position = arg.$position;
    }

    let slice: number | undefined = undefined;
    if ('$slice' in arg) {
      if (typeof arg.$slice !== 'number') throw new Error('$slice must be a numeric value');
      slice = arg.$slice;
    }

    let sortFunction: any = undefined;
    if (arg.$sort) {
      if (slice === undefined) throw new Error('$sort requires $slice to be present');
      sortFunction = new Sorter(arg.$sort).getComparator();
      toPush.forEach(element => {
        if (typeof element !== 'object' || element === null) {
          throw new Error('$push like modifiers using $sort require all elements to be objects');
        }
      });
    }

    if (position === undefined) {
      toPush.forEach(element => target[field].push(element));
    } else {
      target[field].splice(position, 0, ...toPush);
    }

    if (sortFunction) target[field].sort(sortFunction);

    if (slice !== undefined) {
      if (slice === 0) target[field] = [];
      else if (slice < 0) target[field] = target[field].slice(slice);
      else target[field] = target[field].slice(0, slice);
    }
  },
  $pushAll(target: any, field: string, arg: any) {
    if (!Array.isArray(arg)) throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
    assertHasValidFieldNames(arg);
    const toPush = target[field];
    if (toPush === undefined) target[field] = arg;
    else if (!Array.isArray(toPush)) throw new Error('Cannot apply $pushAll modifier to non-array');
    else toPush.push(...arg);
  },
  $addToSet(target: any, field: string, arg: any) {
    const isEach = typeof arg === 'object' && arg !== null && Object.keys(arg)[0] === '$each';
    const values = isEach ? arg.$each : [arg];
    assertHasValidFieldNames(values);

    const toAdd = target[field];
    if (toAdd === undefined) {
      target[field] = values;
    } else if (!Array.isArray(toAdd)) {
      throw new Error('Cannot apply $addToSet modifier to non-array');
    } else {
      values.forEach((value: any) => {
        if (!toAdd.some(element => isEqual(value, element))) toAdd.push(value);
      });
    }
  },
  $pop(target: any, field: string, arg: any) {
    if (target === undefined) return;
    const toPop = target[field];
    if (toPop === undefined) return;
    if (!Array.isArray(toPop)) throw new Error('Cannot apply $pop modifier to non-array');

    if (typeof arg === 'number' && arg < 0) toPop.splice(0, 1);
    else toPop.pop();
  },
  $pull(target: any, field: string, arg: any) {
    if (target === undefined) return;
    const toPull = target[field];
    if (toPull === undefined) return;
    if (!Array.isArray(toPull)) throw new Error('Cannot apply $pull/pullAll modifier to non-array');

    if (arg != null && typeof arg === 'object' && !Array.isArray(arg)) {
      const matcher = new Matcher(arg);
      target[field] = toPull.filter(element => !matcher.documentMatches(element).result);
    } else {
      target[field] = toPull.filter(element => !isEqual(element, arg));
    }
  },
  $pullAll(target: any, field: string, arg: any) {
    if (!Array.isArray(arg)) throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
    if (target === undefined) return;
    const toPull = target[field];
    if (toPull === undefined) return;
    if (!Array.isArray(toPull)) throw new Error('Cannot apply $pull/pullAll modifier to non-array');

    target[field] = toPull.filter(object => !arg.some(element => isEqual(object, element)));
  },
  $bit() {
    throw new Error('$bit is not supported');
  }
};

/**
 * Applies MongoDB-style modifiers to a document in place.
 * * @param doc The original document to modify
 * @param modifier The modifier object (e.g. { $set: { "a.b": 1 } })
 * @param options Options like `isInsert` and `arrayIndices`
 */
export const modify = (doc: any, modifier: any, options: ModifyOptions = {}) => {
  if (typeof modifier !== 'object' || modifier === null) {
    throw new Error('Modifier must be an object');
  }

  // Defensively clone the modifier to avoid mutating it while parsing
  modifier = structuredClone(modifier);

  const isModifier = isOperatorObject(modifier);
  const newDoc = isModifier ? structuredClone(doc) : modifier;

  if (isModifier) {
    Object.keys(modifier).forEach(operator => {
      const setOnInsert = options.isInsert && operator === '$setOnInsert';
      const modFunc = MODIFIERS[setOnInsert ? '$set' : operator];
      const operand = modifier[operator];

      if (!modFunc) throw new Error(`Invalid modifier specified ${operator}`);

      Object.keys(operand).forEach(keypath => {
        if (keypath === '') throw new Error('An empty update path is not valid.');

        const keyparts = keypath.split('.');
        if (!keyparts.every(Boolean)) {
          throw new Error(`The update path '${keypath}' contains an empty field name, which is not allowed.`);
        }

        const target = findModTarget(newDoc, keyparts, {
          arrayIndices: options.arrayIndices,
          forbidArray: operator === '$rename',
          noCreate: NO_CREATE_MODIFIERS[operator]
        });

        modFunc(target, keyparts.pop() as string, operand[keypath], keypath, newDoc);
      });
    });

    if (doc._id && !isEqual(doc._id, newDoc._id)) {
      throw new Error(`The (immutable) field '_id' was found to have been altered to _id: "${newDoc._id}"`);
    }
  } else {
    if (doc._id && modifier._id && !isEqual(doc._id, modifier._id)) {
      throw new Error(`The _id field cannot be changed from {_id: "${doc._id}"} to {_id: "${modifier._id}"}`);
    }
    assertHasValidFieldNames(modifier);
  }

  // Apply changes in place
  Object.keys(doc).forEach(key => {
    if (key !== '_id') delete doc[key];
  });

  Object.keys(newDoc).forEach(key => {
    doc[key] = newDoc[key];
  });
};