import type { IPushToken, Optional } from '@rocket.chat/core-typings';
import { PushToken } from '@rocket.chat/models';

import { findDocumentToUpdate } from './findDocumentToUpdate';
import { logger } from '../logger';

export type PushTokenData = Optional<
	Pick<IPushToken, '_id' | 'token' | 'authToken' | 'appName' | 'userId' | 'metadata' | 'voipToken'>,
	'_id' | 'metadata'
>;

function canModifyTokenDocument(doc: IPushToken, data: Partial<IPushToken>): boolean {
	// If there's no voip on either side of the operation, any doc can be updated
	if (!doc.voipToken && !data.voipToken) {
		return true;
	}

	// VoIP tokens MUST be referenced by id, so if there's no id on the data, do not let this doc be changed
	if (!data._id || data._id !== doc._id) {
		return false;
	}

	return true;
}

async function insertToken(data: PushTokenData): Promise<IPushToken['_id']> {
	const insertResult = await PushToken.insertToken({
		...(data._id && { _id: data._id }),
		token: data.token,
		authToken: data.authToken,
		appName: data.appName,
		userId: data.userId,
		...(data.metadata && { metadata: data.metadata }),
		...(data.voipToken && data._id && { voipToken: data.voipToken }),
	});

	const { authToken: _, ...dataWithNoAuthToken } = data;
	logger.debug({ msg: 'Push token added', dataWithNoAuthToken, insertResult });

	return insertResult.insertedId;
}

async function updateToken(doc: IPushToken, data: PushTokenData): Promise<IPushToken['_id']> {
	const updateResult = await PushToken.refreshTokenById(doc._id, {
		token: data.token,
		authToken: data.authToken,
		appName: data.appName,
		userId: data.userId,
		...(data.voipToken && { voipToken: data.voipToken }),
	});

	if (updateResult.modifiedCount) {
		const { authToken: _, ...dataWithNoAuthToken } = data;
		logger.debug({ msg: 'Push token updated', dataWithNoAuthToken, updateResult });
	}

	return doc._id;
}

export async function registerPushToken(data: PushTokenData): Promise<IPushToken['_id']> {
	const doc = await findDocumentToUpdate(data);

	if (!doc || !canModifyTokenDocument(doc, data)) {
		return insertToken(data);
	}

	return updateToken(doc, data);
}
