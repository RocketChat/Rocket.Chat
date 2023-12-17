import type { IPushService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { PushToken } from '@rocket.chat/models';

export class PushService extends ServiceClassInternal implements IPushService {
	protected name = 'push';

	constructor() {
		super();

		this.onEvent('watch.users', async (data) => {
			// for some reason data.diff can be set to undefined
			if (!('diff' in data) || !data.diff || !('services.resume.loginTokens' in data.diff)) {
				return;
			}
			if (data.diff['services.resume.loginTokens'] === undefined) {
				await PushToken.removeAllByUserId(data.id);
				return;
			}
			const loginTokens = Array.isArray(data.diff['services.resume.loginTokens']) ? data.diff['services.resume.loginTokens'] : [];
			const tokens = loginTokens.map(({ hashedToken }: { hashedToken: string }) => hashedToken);
			if (tokens.length > 0) {
				await PushToken.removeByUserIdExceptTokens(data.id, tokens);
			}
		});
	}
}
