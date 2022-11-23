import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:name');

/**
 * Set name of queue
 * @name Agenda#name
 * @function
 * @param name name of agenda instance
 */
export const name = function (this: Agenda, name: string): Agenda {
	debug('Agenda.name(%s)', name);
	this._name = name;
	return this;
};
