import type { IPushService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IPushToken, Optional } from '@rocket.chat/core-typings';
import { PushToken } from '@rocket.chat/models';

import { logger } from './logger';
import { registerPushToken } from './tokenManagement/registerPushToken';

export class PushService extends ServiceClassInternal implements IPushService {
	protected name = 'push';

	private async syncPushTokensByLoginTokens(userId: string, loginTokens: Array<{ hashedToken: string }> | undefined): Promise<void> {
		if (!Array.isArray(loginTokens) || loginTokens.length === 0) {
			await PushToken.removeAllByUserId(userId);
			return;
		}

		const tokens = loginTokens.map(({ hashedToken }) => hashedToken);
		if (tokens.length > 0) {
			await PushToken.removeByUserIdExceptTokens(userId, tokens);
		}
	}

	constructor() {
		super();

		this.onEvent('watch.users', async (data) => {
			// for some reason data.diff can be set to undefined
			if (!('diff' in data) || !data.diff || !('services.resume.loginTokens' in data.diff)) {
				return;
			}

			const loginTokens = Array.isArray(data.diff['services.resume.loginTokens']) ? data.diff['services.resume.loginTokens'] : [];
			await this.syncPushTokensByLoginTokens(data.id, Array.isArray(loginTokens) ? loginTokens : undefined);
		});

		this.onEvent('watch.userSessions', async ({ id, loginTokens }) => {
			await this.syncPushTokensByLoginTokens(id, loginTokens);
		});
	}

	async registerPushToken(
		data: Optional<Pick<IPushToken, '_id' | 'token' | 'authToken' | 'appName' | 'userId' | 'metadata'>, '_id' | 'metadata'>,
	): Promise<Omit<IPushToken, 'authToken'>> {
		const tokenId = await registerPushToken(data);

		const removeResult = await PushToken.removeDuplicateTokens({
			_id: tokenId,
			token: data.token,
			appName: data.appName,
			authToken: data.authToken,
		});
		if (removeResult.deletedCount) {
			logger.debug({ msg: 'Removed existing app items', removed: removeResult.deletedCount });
		}

		const updatedDoc = await PushToken.findOneById<Omit<IPushToken, 'authToken'>>(tokenId, { projection: { authToken: 0 } });
		if (!updatedDoc) {
			logger.error({ msg: 'Could not find PushToken document on mongo after successful operation', tokenId });
			throw new Error('could-not-find-token-document');
		}

		return updatedDoc;
	}
}
