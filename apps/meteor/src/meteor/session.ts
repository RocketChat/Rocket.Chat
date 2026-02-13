import { ReactiveDict } from './reactive-dict.ts';

export const Session = new ReactiveDict('session');

// Documentation here is really awkward because the methods are defined
// elsewhere

/**
 * @memberOf Session
 * @method set
 * @summary Set a variable in the session. Notify any listeners that the value
 * has changed (eg: redraw templates, and rerun any
 * [`Tracker.autorun`](#tracker_autorun) computations, that called
 * [`Session.get`](#session_get) on this `key`.)
 * @locus Client
 * @param {String} key The key to set, eg, `selectedItem`
 * @param {EJSONable | undefined} value The new value for `key`
 */

/**
 * @memberOf Session
 * @method setDefault
 * @summary Set a variable in the session if it hasn't been set before.
 * Otherwise works exactly the same as [`Session.set`](#session_set).
 * @locus Client
 * @param {String} key The key to set, eg, `selectedItem`
 * @param {EJSONable | undefined} value The new value for `key`
 */

/**
 * @memberOf Session
 * @method get
 * @summary Get the value of a session variable. If inside a [reactive
 * computation](#reactivity), invalidate the computation the next time the
 * value of the variable is changed by [`Session.set`](#session_set). This
 * returns a clone of the session value, so if it's an object or an array,
 * mutating the returned value has no effect on the value stored in the
 * session.
 * @locus Client
 * @param {String} key The name of the session variable to return
 */

/**
 * @memberOf Session
 * @method equals
 * @summary Test if a session variable is equal to a value. If inside a
 * [reactive computation](#reactivity), invalidate the computation the next
 * time the variable changes to or from the value.
 * @locus Client
 * @param {String} key The name of the session variable to test
 * @param {String | Number | Boolean | null | undefined} value The value to
 * test against
 */
