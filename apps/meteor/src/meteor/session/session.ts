import { ReactiveDict } from 'meteor/reactive-dict';

/**
 * A global ReactiveDict instance whose contents are preserved across Hot Code Pushes.
 * Usually used to store the current state of the user interface.
 */
export const Session = new ReactiveDict<Record<string, any>>('session');