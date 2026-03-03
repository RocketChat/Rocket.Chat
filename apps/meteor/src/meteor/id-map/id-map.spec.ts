import { describe, it, expect } from 'vitest';
import { IdMap } from 'meteor/id-map';

describe('IdMap', () => {
  it('should store and retrieve values using object keys', () => {
    // Custom stringifier for an object with an ID
    const stringify = (obj: { _id: string }) => obj._id;
    const parse = (str: string) => ({ _id: str });

    const map = new IdMap<{ _id: string }, string>(stringify, parse);
    const key1 = { _id: 'foo' };
    const key2 = { _id: 'bar' };

    map.set(key1, 'value1');
    map.set(key2, 'value2');

    expect(map.get(key1)).toBe('value1');
    expect(map.get({ _id: 'foo' })).toBe('value1'); // Reference independence
    expect(map.has(key2)).toBe(true);
    expect(map.size()).toBe(2);
  });

  it('should default to JSON stringify/parse if no custom parsers are provided', () => {
    const map = new IdMap<Record<string, any>, number>();
    const key = { complex: 'object', nested: { array: [1, 2, 3] } };
    
    map.set(key, 42);
    expect(map.get(key)).toBe(42);
    expect(map.has({ complex: 'object', nested: { array: [1, 2, 3] } })).toBe(true);
  });

  it('should cleanly remove and clear items', () => {
    const map = new IdMap<string, number>();
    map.set('a', 1);
    map.set('b', 2);

    expect(map.empty()).toBe(false);
    
    map.remove('a');
    expect(map.has('a')).toBe(false);
    expect(map.size()).toBe(1);

    map.clear();
    expect(map.empty()).toBe(true);
    expect(map.size()).toBe(0);
  });

  it('should set default values if key does not exist', () => {
    const map = new IdMap<string, string>();
    
    // Key doesn't exist, should return the provided default and set it
    const res1 = map.setDefault('newKey', 'defaultValue');
    expect(res1).toBe('defaultValue');
    expect(map.get('newKey')).toBe('defaultValue');

    // Key exists, should return the existing value, NOT the newly provided default
    const res2 = map.setDefault('newKey', 'anotherValue');
    expect(res2).toBe('defaultValue');
    expect(map.get('newKey')).toBe('defaultValue');
  });

  it('should break early out of forEach if false is returned', () => {
    const map = new IdMap<number, string>();
    map.set(1, 'a');
    map.set(2, 'b');
    map.set(3, 'c');

    let iterations = 0;
    map.forEach((_value, id) => {
      iterations++;
      if (id === 2) return false; // stop iteration
    });

    expect(iterations).toBe(2);
  });
});