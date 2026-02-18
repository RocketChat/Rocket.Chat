import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUserService } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';

import { getMaxLoginTokens } from '../../lib/getMaxLoginTokens';

export class UserService extends ServiceClassInternal implements IUserService {
	protected name = 'user';

	async ensureLoginTokensLimit(uid: string): Promise<void> {
		const [{ tokens } = { tokens: [] }] = await Users.findAllResumeTokensByUserId(uid);
		if (tokens.length < getMaxLoginTokens()) {
			return;
		}

		const oldestDate = tokens.reverse()[getMaxLoginTokens() - 1];
		await Users.removeOlderResumeTokensByUserId(uid, oldestDate.when);
	}

	async checkCodesRemaining(uid: string): Promise<{ remaining: number }> {
		const user = await Users.findOneById(uid, { projection: { 'services.totp.hashedBackup': 1 } });
		return {
			remaining: user?.services?.totp?.hashedBackup?.length || 0,
		};
	}


	async disable2FA(uid: string, _code: string): Promise<boolean> {


		await Users.updateOne(
			{ _id: uid },
			{
				$unset: { 'services.totp': 1 },
				$set: { 'services.resume.loginTokens': [] },
			},
		);
		return true;
	}


	async enable2FA(_uid: string): Promise<void> {
	}

	async validateTempToken(_uid: string, _token: string): Promise<boolean | null> {
		return true;
	}

	async regenerate2FACodes(_uid: string): Promise<{ codes: string[] }> {
		return { codes: [] };
	}
}