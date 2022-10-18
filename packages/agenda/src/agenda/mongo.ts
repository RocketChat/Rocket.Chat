import type { AnyError, Collection, Db } from 'mongodb';

import type { Agenda } from '.';

/**
 * Build method used to add MongoDB connection details
 * @name Agenda#mongo
 * @function
 * @param mdb instance of MongoClient to use
 * @param [collection] name collection we want to use ('agendaJobs')
 * @param [cb] called when MongoDB connection fails or passes
 */
export const mongo = function (
	this: Agenda,
	mdb: Db,
	collection?: string,
	cb?: (error: AnyError | undefined, collection: Collection<any> | null) => void,
): Agenda {
	this._mdb = mdb;
	this.db_init(collection, cb);
	return this;
};
