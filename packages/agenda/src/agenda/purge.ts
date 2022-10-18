import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:purge');

/**
 * Removes all jobs from queue
 * @name Agenda#purge
 * @function
 * @returns resolved when job cancelling fails or passes
 */
export const purge = async function (this: Agenda): Promise<number | undefined> {
	// @NOTE: Only use after defining your jobs
	const definedNames = Object.keys(this._definitions);
	debug('Agenda.purge(%o)', definedNames);
	return this.cancel({ name: { $not: { $in: definedNames } } });
};
