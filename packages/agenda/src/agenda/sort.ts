import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:sort');

/**
 * Set the sort query for finding next job
 * Default is { nextRunAt: 1, priority: -1 }
 * @name Agenda#sort
 * @function
 * @param query sort query object for MongoDB
 */
export const sort = function (this: Agenda, query: any): Agenda {
	debug('Agenda.sort([Object])');
	this._sort = query;
	return this;
};
