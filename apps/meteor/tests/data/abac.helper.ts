import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import { URL_MONGODB } from '../e2e/config/constants';

// Writes to the DB directly to avoid going through LDAP. Assigning an attribute to a room evicts
// every member that does not carry it, so a user that has to stay in the room needs its attributes
// set before the room's.
export const addAbacAttributesToUserDirectly = async (userId: string, abacAttributes: IAbacAttributeDefinition[]): Promise<void> => {
	const connection = await MongoClient.connect(URL_MONGODB);

	try {
		await connection.db().collection('users').updateOne(
			// @ts-expect-error - collection types for _id
			{ _id: userId },
			{ $set: { abacAttributes } },
		);
	} finally {
		await connection.close();
	}
};
