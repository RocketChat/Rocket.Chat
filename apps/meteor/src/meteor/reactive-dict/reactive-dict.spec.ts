import { describe, it, expect } from 'vitest';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict'; // adjust the extension if needed

describe('ReactiveDict', () => {
  it('set to undefined', () => {
    const dict = new ReactiveDict<any>();
    dict.set('foo', undefined);
    
    expect(Object.keys(dict.all())).toEqual(['foo']);
    
    dict.setDefault('foo', 'bar');
    expect(dict.get('foo')).toBeUndefined();
  });

  it('initialize with data', () => {
    const now = new Date();
    
    // Explicitly type as <any> so we can reassign it to different shapes
    let dict: ReactiveDict<any> = new ReactiveDict({ now });
    expect(dict.get('now')).toEqual(now);

    dict = new ReactiveDict('test-init-foo', { foo: 'bar' });
    expect(dict.get('foo')).toBe('bar');
    dict.destroy(); // Clean up to avoid duplicate name error

    dict = new ReactiveDict(undefined, { now });
    expect(dict.get('now')).toEqual(now);
  });

  it('setDefault works correctly', () => {
    let dict = new ReactiveDict<any>();
    dict.set('A', 'blah');
    dict.set('B', undefined);
    dict.setDefault('A', 'default');
    dict.setDefault('B', 'default');
    dict.setDefault('C', 'default');
    dict.setDefault('D', undefined);
    
    expect(dict.all()).toEqual({
      A: 'blah', 
      B: undefined,
      C: 'default', 
      D: undefined
    });

    dict = new ReactiveDict<any>();
    dict.set('A', 'blah');
    dict.set('B', undefined);
    dict.setDefault({
      A: 'default',
      B: 'default', // Using a correct spelling here
      C: 'default',
      D: undefined
    });
    
    expect(dict.all()).toEqual({
      A: 'blah', 
      B: undefined,
      C: 'default', 
      D: undefined
    });
  });

  it('all() triggers reactive computations properly', () => {
    let all = {};
    const dict = new ReactiveDict<any>();
    
    Tracker.autorun(() => {
      all = dict.all();
    });

    expect(all).toEqual({});

    dict.set('foo', 'bar');
    Tracker.flush();
    expect(all).toEqual({ foo: 'bar' });

    dict.set('blah', undefined);
    Tracker.flush();
    expect(all).toEqual({ foo: 'bar', blah: undefined });
  });

  it('clear() works without throwing and cleans dictionary', () => {
    const dict = new ReactiveDict<any>();
    dict.set('foo', 'bar');

    dict.clear();
    dict.set('foo', 'bar');

    let val, equals, equalsUndefined, all;
    Tracker.autorun(() => { val = dict.get('foo'); });
    Tracker.autorun(() => { equals = dict.equals('foo', 'bar'); });
    Tracker.autorun(() => { equalsUndefined = dict.equals('foo', undefined); });
    Tracker.autorun(() => { all = dict.all(); });

    expect(val).toBe('bar');
    expect(equals).toBe(true);
    expect(equalsUndefined).toBe(false);
    expect(all).toEqual({ foo: 'bar' });

    dict.clear();
    Tracker.flush();
    
    expect(val).toBeUndefined();
    expect(equals).toBe(false);
    expect(equalsUndefined).toBe(true);
    expect(all).toEqual({});
  });

  it('delete(key) works', () => {
    const dict = new ReactiveDict<any>();
    dict.set('foo', 'bar');
    dict.set('bar', 'foo');
    dict.set('baz', 123);
    
    expect(dict.delete('baz')).toBe(true);
    expect(dict.delete('baz')).toBe(false);

    let val, equals, equalsUndefined, all;

    Tracker.autorun(() => { val = dict.get('foo'); });
    Tracker.autorun(() => { equals = dict.equals('foo', 'bar'); });
    Tracker.autorun(() => { equalsUndefined = dict.equals('foo', undefined); });
    Tracker.autorun(() => { all = dict.all(); });

    expect(val).toBe('bar');
    expect(equals).toBe(true);
    expect(equalsUndefined).toBe(false);
    expect(all).toEqual({ foo: 'bar', bar: 'foo' });

    let didRemove = dict.delete('foo');
    expect(didRemove).toBe(true);

    Tracker.flush();

    expect(val).toBeUndefined();
    expect(equals).toBe(false);
    expect(equalsUndefined).toBe(true);
    expect(all).toEqual({ bar: 'foo' });

    didRemove = dict.delete('barfoobar');
    expect(didRemove).toBe(false);
  });

  it('destroy() works and frees up naming registry', () => {
    // Explicit <any> prevents TS from inferring generic O as a `String`
    let dict: ReactiveDict<any> = new ReactiveDict('test-destroy');

    // Trying to create a dict with the same name throws
    expect(() => {
      new ReactiveDict('test-destroy');
    }).toThrow('Duplicate ReactiveDict name: test-destroy');

    dict.set('foo', 'bar');

    let val, equals, equalsUndefined, all;
    Tracker.autorun(() => { val = dict.get('foo'); });
    Tracker.autorun(() => { equals = dict.equals('foo', 'bar'); });
    Tracker.autorun(() => { equalsUndefined = dict.equals('foo', undefined); });
    Tracker.autorun(() => { all = dict.all(); });

    expect(val).toBe('bar');
    expect(equals).toBe(true);
    expect(equalsUndefined).toBe(false);
    expect(all).toEqual({ foo: 'bar' });

    dict.destroy();
    Tracker.flush();
    
    expect(val).toBeUndefined();
    expect(equals).toBe(false);
    expect(equalsUndefined).toBe(true);
    expect(all).toEqual({});

    // Should no longer throw since the dictionary was destroyed
    dict = new ReactiveDict('test-destroy');
    expect(dict).toBeDefined();
  });
});