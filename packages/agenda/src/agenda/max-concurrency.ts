import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:maxConcurrency');

/**
 * Set the concurrency for jobs (globally), type does not matter
 * @name Agenda#maxConcurrency
 * @function
 * @param concurrency max concurrency value
 * @returns agenda instance
 */
export const maxConcurrency = function (this: Agenda, concurrency: number): Agenda {
	debug('Agenda.maxConcurrency(%d)', concurrency);
	this._maxConcurrency = concurrency;
	return this;
};
