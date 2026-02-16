import type { IPushService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { PushToken } from '@rocket.chat/models';

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
}
