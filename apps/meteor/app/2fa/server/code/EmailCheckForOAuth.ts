import type { IUser } from '@rocket.chat/core-typings';
import { TwoFactorChallenges } from '@rocket.chat/models';

import { EmailCheck } from './EmailCheck';

export class EmailCheckForOAuth extends EmailCheck {
	public override readonly name = 'email-oauth';

	public readonly method = 'email';

	public async sendTwoFactorChallenge(user: IUser): Promise<string> {
		const now = new Date();
		const challenge = await TwoFactorChallenges.insertOne({
			userId: user._id,
			method: 'email',
			createdAt: now,
			expireAt: new Date(now.getTime() + 1000 * 60 * 5),
		});
		await this.sendEmailCode(user);
		return challenge.insertedId;
	}

	public async verifyEmailTwoFactorChallenge(user: IUser, challengeId: string, code: string): Promise<boolean> {
		const challenge = await TwoFactorChallenges.findOneByPendingChallengeId(challengeId);
		if (!challenge) {
			return false;
		}

		const isCodeValid = await this.verify(user, code);

		if (!isCodeValid) {
			return false;
		}

		await TwoFactorChallenges.removeByPendingChallengeId(challengeId);

		return true;
	}
}
