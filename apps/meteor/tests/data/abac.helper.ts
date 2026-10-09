import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import type { MongoClient } from 'mongodb';

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
