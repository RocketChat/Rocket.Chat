import createDebugger from 'debug';
import type { Document, Filter } from 'mongodb';

import type { Agenda } from '.';

const debug = createDebugger('agenda:cancel');

/**
 * Cancels any jobs matching the passed MongoDB query, and removes them from the database.
 * @name Agenda#cancel
 * @function
 * @param query MongoDB query to use when cancelling
 * @caller client code, Agenda.purge(), Job.remove()
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cancel = async function (this: Agenda, query: Filter<Document>): Promise<number | undefined> {
	debug('attempting to cancel all Agenda jobs', query);
	try {
		const { deletedCount } = await this._collection.deleteMany(query);
		debug('%s jobs cancelled', deletedCount);
		return deletedCount;
	} catch (error) {
		debug('error trying to delete jobs from MongoDB');
		throw error;
	}
};
