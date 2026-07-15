import type { IPushService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IPushToken, RegisterPushTokenInput } from '@rocket.chat/core-typings';
import { PushToken } from '@rocket.chat/models';

import { logger } from './logger';
import { registerPushToken } from './tokenManagement/registerPushToken';

export class PushService extends ServiceClassInternal implements IPushService {
	protected name = 'push';

	constructor() {
		super();

		this.onEvent('watch.users', async (data) => {
			// for some reason data.diff can be set to undefined
			if (!('diff' in data) || !data.diff || !('services.resume.loginTokens' in data.diff)) {
				return;
			}

			const loginTokens = Array.isArray(data.diff['services.resume.loginTokens']) ? data.diff['services.resume.loginTokens'] : [];

			if (data.diff['services.resume.loginTokens'] === undefined || loginTokens.length === 0) {
				await PushToken.removeAllByUserId(data.id);
				return;
			}
			const tokens = loginTokens.map(({ hashedToken }: { hashedToken: string }) => hashedToken);
			if (tokens.length > 0) {
				await PushToken.removeByUserIdExceptTokens(data.id, tokens);
			}
		});
	}

	async registerPushToken(data: RegisterPushTokenInput): Promise<Omit<IPushToken, 'authToken'>> {
		const { authToken, appName, userId } = data;
		const tokenType = 'apn' in data.token ? 'apn' : 'gcm';
		const tokenValue = 'apn' in data.token ? data.token.apn : data.token.gcm;

		const tokenId = await registerPushToken({ _id: data._id, tokenType, tokenValue, authToken, appName, userId, metadata: data.metadata });

		if (data.voipToken) {
			await registerPushToken({ tokenType: 'voip', tokenValue: data.voipToken, authToken, appName, userId });
		}

		const updatedDoc = await PushToken.findOneById<Omit<IPushToken, 'authToken'>>(tokenId, { projection: { authToken: 0 } });
		if (!updatedDoc) {
			logger.error({ msg: 'Could not find PushToken document on mongo after successful operation', tokenId });
			throw new Error('could-not-find-token-document');
		}

		return updatedDoc;
	}
}
