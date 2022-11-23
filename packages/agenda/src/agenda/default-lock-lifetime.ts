import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:defaultLockLifetime');

/**
 * Set the default lock time (in ms)
 * Default is 10 * 60 * 1000 ms (10 minutes)
 * @name Agenda#defaultLockLifetime
 * @function
 * @param {Number} ms time in ms to set default lock
 */
export const defaultLockLifetime = function (this: Agenda, ms: number): Agenda {
	debug('Agenda.defaultLockLifetime(%d)', ms);
	this._defaultLockLifetime = ms;
	return this;
};
