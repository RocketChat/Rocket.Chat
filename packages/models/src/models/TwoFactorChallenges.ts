import { randomBytes } from 'crypto';

import type { ITwoFactorChallenge } from '@rocket.chat/core-typings';
import type { ITwoFactorChallengesModel } from '@rocket.chat/model-typings';
import type { Db, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class TwoFactorChallengesRaw extends BaseRaw<ITwoFactorChallenge> implements ITwoFactorChallengesModel {
	constructor(db: Db) {
		super(db, 'two_factor_challenges');
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { expireAt: 1 }, expireAfterSeconds: 0 }];
	}

	findOneByPendingChallengeId(pendingChallengeId: string, options?: FindOptions<ITwoFactorChallenge>) {
		return this.findOne({ _id: pendingChallengeId }, options);
	}

	removeByPendingChallengeId(pendingChallengeId: string) {
		return this.deleteOne({ _id: pendingChallengeId });
	}

	async createTwoFactorChallenge(userId: string, method: ITwoFactorChallenge['method']): Promise<string> {
		const now = new Date();
		const challengeId = randomBytes(32).toString('hex');
		await this.insertOne({
			_id: challengeId,
			userId,
			method,
			createdAt: now,
			expireAt: new Date(now.getTime() + 1000 * 60 * 5),
		});
		return challengeId;
	}
}
