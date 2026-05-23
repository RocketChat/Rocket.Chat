import type { IUser } from '@rocket.chat/core-typings';
import { TwoFactorChallenges } from '@rocket.chat/models';

import { EmailCheck } from './EmailCheck';

export class EmailCheckForOAuth extends EmailCheck {
	public override readonly name = 'email-oauth';

	public readonly method = 'email';

	public async sendTwoFactorChallenge(user: IUser): Promise<string> {
		const challengeId = await TwoFactorChallenges.createTwoFactorChallenge(user._id, 'email');
		await this.sendEmailCode(user);
		return challengeId;
	}

	public async verifyEmailTwoFactorChallenge(user: IUser, challengeId: string, code: string): Promise<boolean> {
		const challenge = await TwoFactorChallenges.findOneByPendingChallengeId(challengeId);
		if (!challenge) {
			return false;
		}

		if (challenge.expireAt && challenge.expireAt < new Date()) {
			throw new Meteor.Error('error-challenge-expired', 'challenge expired');
		}

		const isCodeValid = await this.verify(user, code);

		if (!isCodeValid) {
			return false;
		}

		await TwoFactorChallenges.removeByPendingChallengeId(challengeId);

		return true;
	}
}
