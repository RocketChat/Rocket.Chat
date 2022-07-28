import { PushToken } from '@rocket.chat/models';

import { IPushService } from '../../sdk/types/IPushService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';

export class PushService extends ServiceClassInternal implements IPushService {
	protected name = 'push';

	constructor() {
		super();

		this.onEvent('watch.users', async ({ id, diff }) => {
			if (diff && 'services.resume.loginTokens' in diff) {
				const tokens = diff['services.resume.loginTokens'].map(({ hashedToken }: { hashedToken: string }) => hashedToken);
				this.cleanUpUserTokens(id, tokens);
			}
		});
	}

	private async cleanUpUserTokens(userId: string, tokens: string[]): Promise<void> {
		await PushToken.removeByUserIdExceptTokens(userId, tokens);
	}
}
