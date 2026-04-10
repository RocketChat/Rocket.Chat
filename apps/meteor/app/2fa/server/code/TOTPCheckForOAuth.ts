import type { IUser } from '@rocket.chat/core-typings';
import { TwoFactorChallenges } from '@rocket.chat/models';

import { TOTPCheck } from './TOTPCheck';

export class TOTPCheckForOAuth extends TOTPCheck {
	public override readonly name = 'totp-oauth';

	public readonly method = 'totp';

	public async sendTwoFactorChallenge(user: IUser): Promise<string> {
		const now = new Date();
		const challenge = await TwoFactorChallenges.insertOne({
			userId: user._id,
			method: 'totp',
			createdAt: now,
			expireAt: new Date(now.getTime() + 1000 * 60 * 5),
		});
		return challenge.insertedId;
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
