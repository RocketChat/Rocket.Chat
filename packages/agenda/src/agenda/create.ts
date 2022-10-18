import createDebugger from 'debug';

import { Job } from '../job';
import type { Agenda } from '.';

const debug = createDebugger('agenda:create');

/**
 * Given a name and some data, create a new job
 * @name Agenda#create
 * @function
 * @param name name of job
 * @param data data to set for job
 */
export const create = function (this: Agenda, name: string, data: any): Job {
	debug('Agenda.create(%s, [Object])', name);
	const priority = this._definitions[name] ? this._definitions[name].priority : 0;
	const shouldSaveResult = this._definitions[name] ? this._definitions[name].shouldSaveResult || false : false;
	const job = new Job({ name, data, type: 'normal', priority, shouldSaveResult, agenda: this });
	return job;
};
