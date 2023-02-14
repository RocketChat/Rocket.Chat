import { PushToken } from '@rocket.chat/models';
import type { IPushService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

export class PushService extends ServiceClassInternal implements IPushService {
	protected name = 'push';

	constructor() {
		super();

		this.onEvent('watch.users', async ({ id, diff }) => {
			if (!diff || !('services.resume.loginTokens' in diff)) {
				return;
			}
			if (diff['services.resume.loginTokens'] === undefined) {
				await PushToken.removeAllByUserId(id);
				return;
			}
			const loginTokens = Array.isArray(diff['services.resume.loginTokens']) ? diff['services.resume.loginTokens'] : [];
			const tokens = loginTokens.map(({ hashedToken }: { hashedToken: string }) => hashedToken);
			if (tokens.length > 0) {
				await PushToken.removeByUserIdExceptTokens(id, tokens);
			}
		});
	}
}
