import createDebugger from 'debug';
import type { AnyError, Collection, MongoClientOptions } from 'mongodb';
import { MongoClient } from 'mongodb';

import type { Agenda } from '.';
import { hasMongoProtocol } from './has-mongo-protocol';

const debug = createDebugger('agenda:database');

/**
 * Connect to the spec'd MongoDB server and database.
 *
 * NOTE:
 * If `url` includes auth details then `options` must specify: { 'uri_decode_auth': true }. This does Auth on
 * the specified database, not the Admin database. If you are using Auth on the Admin DB and not on the Agenda DB,
 * then you need to authenticate against the Admin DB and then pass the MongoDB instance into the constructor
 * or use Agenda.mongo(). If your app already has a MongoDB connection then use that. ie. specify config.mongo in
 * the constructor or use Agenda.mongo().
 * @name Agenda#database
 * @function
 * @param url MongoDB server URI
 * @param [collection] name of collection to use. Defaults to `agendaJobs`
 * @param [options] options for connecting
 * @param [cb] callback of MongoDB connection
 */
export const database = function (
	this: Agenda,
	url: string,
	collection?: string,
	options: MongoClientOptions = {},
	cb?: (error: AnyError | undefined, collection: Collection<any> | null) => void,
): Agenda | void {
	if (!hasMongoProtocol(url)) {
		url = `mongodb://${url}`;
	}

	collection = collection || 'agendaJobs';

	MongoClient.connect(url, options, (error, client) => {
		if (error) {
			debug('error connecting to MongoDB using collection: [%s]', collection);
			if (cb) {
				cb(error, null);
			} else {
				throw error;
			}

			return;
		}

		debug('successful connection to MongoDB using collection: [%s]', collection);

		if (client) {
			this._db = client;
			this._mdb = client.db();
			this.db_init(collection, cb);
		} else {
			throw new Error('Mongo Client is undefined');
		}
	});
	return this;
};
