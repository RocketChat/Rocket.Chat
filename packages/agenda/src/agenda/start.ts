import createDebugger from 'debug';

import type { Agenda } from '.';
import { processJobs } from '../utils';

const debug = createDebugger('agenda:start');

/**
 * Starts processing jobs using processJobs() methods, storing an interval ID
 * This method will only resolve if a db has been set up beforehand.
 * @name Agenda#start
 * @function
 * @returns resolves if db set beforehand, returns undefined otherwise
 */
export const start = async function (this: Agenda): Promise<void | unknown> {
	if (this._processInterval) {
		debug('Agenda.start was already called, ignoring');
		return this._ready;
	}

	await this._ready;
	debug('Agenda.start called, creating interval to call processJobs every [%dms]', this._processEvery);
	this._processInterval = setInterval(processJobs.bind(this), this._processEvery);
	process.nextTick(processJobs.bind(this));
};
