import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:stop');

/**
 * Clear the interval that processes the jobs
 * @name Agenda#stop
 * @function
 * @returns resolves when job unlocking fails or passes
 */
export const stop = async function (this: Agenda): Promise<void> {
	/**
	 * Internal method to unlock jobs so that they can be re-run
	 * NOTE: May need to update what properties get set here, since job unlocking seems to fail
	 * @access private
	 * @returns resolves when job unlocking fails or passes
	 */
	const _unlockJobs = async (): Promise<void> => {
		return new Promise((resolve, reject) => {
			debug('Agenda._unlockJobs()');
			const jobIds = this._lockedJobs.map((job) => job.attrs._id);

			if (jobIds.length === 0) {
				debug('no jobs to unlock');
				resolve();
			}

			debug('about to unlock jobs with ids: %O', jobIds);
			this._collection.updateMany({ _id: { $in: jobIds } }, { $set: { lockedAt: null } }, (error) => {
				if (error) {
					reject(error);
				}

				this._lockedJobs = [];
				resolve();
			});
		});
	};

	debug('Agenda.stop called, clearing interval for processJobs()');
	clearInterval(this._processInterval);
	this._processInterval = undefined;
	return _unlockJobs();
};
