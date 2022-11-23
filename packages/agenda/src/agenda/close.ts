import createDebugger from 'debug';

import type { Agenda } from '.';

const debug = createDebugger('agenda:close');

/** Close the db and it's underlying connections
 * Only works if agenda was instantiated without preconfigured mongoDb instance.
 * If the mongoDb instance was supplied during instantiation or via agenda.mongo, this function will do nothing and return agenda anyway.
 * @name Agenda#close
 * @function
 * @param [option] {{ force: boolean }} Force close, emitting no events
 *
 *
 * @caller client code
 *
 * @link https://mongodb.github.io/node-mongodb-native/2.0/api/Db.html#close
 */
export const close = async function (this: Agenda, option?: { force: boolean }): Promise<Agenda> {
	debug('close db connection for this agenda instance');
	const closeOptions = {
		force: false,
		...option,
	};
	try {
		if (this._db) {
			await this._db.close(closeOptions.force);
		}

		return this;
	} catch (error) {
		debug('error trying to close db connection to');
		throw error;
	}
};
