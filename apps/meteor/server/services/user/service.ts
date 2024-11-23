import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUserService } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';

import { getMaxLoginTokens } from '../../lib/getMaxLoginTokens';

// TODO merge this service with Account service
export class UserService extends ServiceClassInternal implements IUserService {
	protected name = 'user';

	async ensureLoginTokensLimit(uid: string): Promise<void> {
		const [{ tokens }] = await Users.findAllResumeTokensByUserId(uid);
		if (tokens.length < getMaxLoginTokens()) {
			return;
		}

		const oldestDate = tokens.reverse()[getMaxLoginTokens() - 1];
		await Users.removeOlderResumeTokensByUserId(uid, oldestDate.when);
	}
}
