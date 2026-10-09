import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import type { MongoClient } from 'mongodb';

// Writes to the DB directly to avoid going through LDAP. Assigning an attribute to a room evicts
// every member that does not carry it, so a user that has to stay in the room needs its attributes
// set before the room's.
export const addAbacAttributesToUserDirectly = async (
	connection: MongoClient,
	userId: string,
	abacAttributes: IAbacAttributeDefinition[],
): Promise<void> => {
	const result = await connection.db().collection('users').updateOne(
		// @ts-expect-error - collection types for _id
		{ _id: userId },
		{ $set: { abacAttributes } },
	);

	if (result.matchedCount === 0) {
		throw new Error(`addAbacAttributesToUserDirectly: no user matched ${userId}`);
	}
};
