import createDebugger from 'debug';
import type { AnyError, Collection } from 'mongodb';

import type { Agenda } from '.';

const debug = createDebugger('agenda:db_init');

/**
 * Setup and initialize the collection used to manage Jobs.
 * @name Agenda#dbInit
 * @function
 * @param collection name or undefined for default 'agendaJobs'
 * @param [cb] called when the db is initialized
 */
export const dbInit = function (
	this: Agenda,
	collection = 'agendaJobs',
	cb?: (error: AnyError | undefined, collection: Collection<any> | null) => void,
): void {
	debug('init database collection using name [%s]', collection);
	this._collection = this._mdb.collection(collection);
	if (this._disableAutoIndex) {
		debug('skipping auto index creation');
		this.emit('ready');
		return;
	}

	debug('attempting index creation');
	this._collection.createIndex(this._indices, { name: 'findAndLockNextJobIndex' }, (error) => {
		if (error) {
			debug('index creation failed');
			this.emit('error', error);
		} else {
			debug('index creation success');
			this.emit('ready');
		}

		if (cb) {
			cb(error, this._collection);
		}
	});
};
