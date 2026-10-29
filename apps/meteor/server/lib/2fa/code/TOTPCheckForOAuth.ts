import { ClientSafeError } from '@rocket.chat/core-services';
import { TwoFactorChallenges } from '@rocket.chat/models';

import type { TwoFactorUser } from './ICodeCheck';
import { TOTPCheck } from './TOTPCheck';

export class TOTPCheckForOAuth extends TOTPCheck {
	public override readonly name = 'totp-oauth';

	public readonly method = 'totp';

	public async sendTwoFactorChallenge(user: TwoFactorUser): Promise<string> {
		return TwoFactorChallenges.createTwoFactorChallenge(user._id, 'totp');
	}

	public async verifyEmailTwoFactorChallenge(user: TwoFactorUser, challengeId: string, code: string): Promise<boolean> {
		const challenge = await TwoFactorChallenges.findOneByPendingChallengeId(challengeId);
		if (!challenge) {
			return false;
		}

		if (challenge.expireAt && challenge.expireAt < new Date()) {
			throw new ClientSafeError('error-challenge-expired', 'challenge expired');
		}

		const isCodeValid = await this.verify(user, code);

		if (!isCodeValid) {
			return false;
		}

		await TwoFactorChallenges.removeByPendingChallengeId(challengeId);

		return true;
	}
}
