import createDebugger from 'debug';
import humanInterval from 'human-interval';

import type { Agenda } from '.';

const debug = createDebugger('agenda:processEvery');

/**
 * Set the default process interval
 * @name Agenda#processEvery
 * @function
 * @param time - time to process, expressed in human interval
 */
export const processEvery = function (this: Agenda, time: string): Agenda {
	debug('Agenda.processEvery(%d)', time);
	// @ts-expect-error
	this._processEvery = humanInterval(time);
	return this;
};
