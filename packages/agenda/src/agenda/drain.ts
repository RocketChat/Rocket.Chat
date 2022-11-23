import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:drain');

/**
 * Clear the interval that processes the jobs
 * @name Agenda#drain
 * @function
 * @returns resolves when all running jobs completes
 */
export const drain = async function (this: Agenda): Promise<void> {
	return new Promise((resolve) => {
		debug('Agenda.drain called, clearing interval for processJobs()');
		clearInterval(this._processInterval);
		this._processInterval = undefined;

		if (this._runningJobs.length === 0) {
			resolve();
		} else {
			debug('Agenda.drain waiting for jobs to finish');
			this.on('complete', () => {
				// running jobs are removed after the event
				if (this._runningJobs.length === 1) {
					resolve();
				}
			});
		}
	});
};
