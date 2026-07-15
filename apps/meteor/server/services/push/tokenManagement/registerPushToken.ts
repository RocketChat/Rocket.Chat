import type { IPushToken, Optional } from '@rocket.chat/core-typings';
import { PushToken } from '@rocket.chat/models';

import { findDocumentToUpdate } from './findDocumentToUpdate';
import { logger } from '../logger';

export type PushTokenData = Optional<
	Pick<IPushToken, '_id' | 'tokenType' | 'tokenValue' | 'authToken' | 'appName' | 'userId' | 'metadata'>,
	'_id' | 'metadata'
>;

async function insertToken(data: PushTokenData): Promise<IPushToken['_id']> {
	const insertResult = await PushToken.insertToken({
		...(data._id && { _id: data._id }),
		tokenType: data.tokenType,
		tokenValue: data.tokenValue,
		authToken: data.authToken,
		appName: data.appName,
		userId: data.userId,
		...(data.metadata && { metadata: data.metadata }),
	});

	const { authToken: _, ...dataWithNoAuthToken } = data;
	logger.debug({ msg: 'Push token added', dataWithNoAuthToken, insertResult });

	return insertResult.insertedId;
}

async function updateToken(doc: IPushToken, data: PushTokenData): Promise<IPushToken['_id']> {
	const updateResult = await PushToken.refreshTokenById(doc._id, {
		tokenType: data.tokenType,
		tokenValue: data.tokenValue,
		authToken: data.authToken,
		appName: data.appName,
		userId: data.userId,
	});

	if (updateResult.modifiedCount) {
		const { authToken: _, ...dataWithNoAuthToken } = data;
		logger.debug({ msg: 'Push token updated', dataWithNoAuthToken, updateResult });
	}

	return doc._id;
}

export async function registerPushToken(data: PushTokenData): Promise<IPushToken['_id']> {
	const doc = await findDocumentToUpdate(data);
	const _id = doc ? await updateToken(doc, data) : await insertToken(data);

	// Scope dedup by tokenType so a coexisting voip doc (same authToken) survives.
	const removeResult = await PushToken.removeDuplicateTokens({
		_id,
		tokenType: data.tokenType,
		tokenValue: data.tokenValue,
		appName: data.appName,
		authToken: data.authToken,
	});
	if (removeResult.deletedCount) {
		logger.debug({ msg: 'Removed existing app items', tokenType: data.tokenType, removed: removeResult.deletedCount });
	}

	return _id;
}
