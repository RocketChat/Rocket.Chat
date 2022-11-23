import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:locklimit');

/**
 * Set the default amount jobs that are allowed to be locked at one time (GLOBAL)
 * @name Agenda#locklimit
 * @function
 * @param limit num Lock limit
 */
export const lockLimit = function (this: Agenda, limit: number): Agenda {
	// @NOTE: Is this different than max concurrency?
	debug('Agenda.lockLimit(%d)', limit);
	this._lockLimit = limit;
	return this;
};
