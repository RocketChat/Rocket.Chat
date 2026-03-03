import { Tracker } from 'meteor/tracker';

export type EqualsFunc<T> = (oldValue: T, newValue: T) => boolean;

/**
 * A ReactiveVar holds a single value that can be get and set,
 * such that calling `set` will invalidate any Computations that
 * called `get`, according to the usual contract for reactive
 * data sources.
 */
export class ReactiveVar<T> {
  private curValue: T;
  private equalsFunc?: EqualsFunc<T> | undefined;
  private dep: Tracker.Dependency;

  /**
   * Constructor for a ReactiveVar, which represents a single reactive variable.
   * * @param initialValue The initial value to set. `equalsFunc` is ignored when setting the initial value.
   * @param equalsFunc Optional. A function of two arguments, called on the old value and the new value 
   * whenever the ReactiveVar is set. If it returns true, no set is performed.
   */
  constructor(initialValue: T, equalsFunc?: EqualsFunc<T>) {
    this.curValue = initialValue;
    this.equalsFunc = equalsFunc;
    this.dep = new Tracker.Dependency();
  }

  /**
   * Evaluates if two values are considered equal in the context of a ReactiveVar.
   * Objects are intentionally always treated as unequal to trigger invalidations 
   * even if the reference is exactly the same.
   */
  public static _isEqual<U>(oldValue: U, newValue: U): boolean {
    const a = oldValue;
    const b = newValue;

    // Two values are "equal" here if they are `===` and are
    // number, boolean, string, undefined, or null.
    if (a !== b) {
      return false;
    }

    return (
      !a || 
      typeof a === 'number' || 
      typeof a === 'boolean' || 
      typeof a === 'string'
    );
  }

  /**
   * Returns the current value of the ReactiveVar, establishing a reactive dependency.
   */
  public get(): T {
    if (Tracker.active) {
      this.dep.depend();
    }

    return this.curValue;
  }

  /**
   * Sets the current value of the ReactiveVar, invalidating the Computations 
   * that called `get` if `newValue` is different from the old value.
   */
  public set(newValue: T): void {
    const oldValue = this.curValue;

    const isEqual = this.equalsFunc 
      ? this.equalsFunc(oldValue, newValue)
      : ReactiveVar._isEqual(oldValue, newValue);

    if (isEqual) {
      // value is the same as last time
      return;
    }

    this.curValue = newValue;
    this.dep.changed();
  }

  public toString(): string {
    return `ReactiveVar{${String(this.get())}}`;
  }

  /**
   * Internal helper used primarily by test suites to determine dependency counts.
   */
  public _numListeners(): number {
    let count = 0;
    // Accesses a private field of Tracker.Dependency.
    // Cast to `any` allows accessing the internal _dependentsById dictionary.
    const dependents = (this.dep as any)._dependentsById;
    
    for (const id in dependents) {
      if (Object.prototype.hasOwnProperty.call(dependents, id)) {
        count++;
      }
    }
    
    return count;
  }
}