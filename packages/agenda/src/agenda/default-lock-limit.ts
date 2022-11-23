import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:defaultLockLimit');

/**
 * Set default lock limit per job type
 * @name Agenda#defaultLockLimit
 * @function
 * @param {Number} num Lock limit per job
 * @returns {Agenda} agenda instance
 */
export const defaultLockLimit = function (this: Agenda, times: number): Agenda {
	debug('Agenda.defaultLockLimit(%d)', times);
	this._defaultLockLimit = times;
	return this;
};
