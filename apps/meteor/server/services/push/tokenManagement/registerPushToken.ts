import type { IPushToken, Optional } from '@rocket.chat/core-typings';
import { PushToken } from '@rocket.chat/models';

import { logger } from '../logger';
import { findDocumentToUpdate } from './findDocumentToUpdate';

export async function registerPushToken(
	data: Optional<Pick<IPushToken, '_id' | 'token' | 'authToken' | 'appName' | 'userId' | 'metadata'>, '_id' | 'metadata'>,
): Promise<IPushToken['_id']> {
	const doc = await findDocumentToUpdate(data);

	if (!doc) {
		const insertResult = await PushToken.insertToken({
			...(data._id && { _id: data._id }),
			token: data.token,
			authToken: data.authToken,
			appName: data.appName,
			userId: data.userId,
			...(data.metadata && { metadata: data.metadata }),
		});

		const { authToken: _, ...dataWithNoAuthToken } = data;
		logger.debug({ msg: 'Push token added', dataWithNoAuthToken, insertResult });

		return insertResult.insertedId;
	}

	const updateResult = await PushToken.refreshTokenById(doc._id, {
		token: data.token,
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
