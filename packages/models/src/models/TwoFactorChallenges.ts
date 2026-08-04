import { randomBytes } from 'crypto';

import type { ITwoFactorChallenge } from '@rocket.chat/core-typings';
import type { ITwoFactorChallengesModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class TwoFactorChallengesRaw extends BaseRaw<ITwoFactorChallenge> implements ITwoFactorChallengesModel {
	constructor(db: Db) {
		super(db, 'two_factor_challenges');
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { expireAt: 1 }, expireAfterSeconds: 0 }];
	}

	findOneByPendingChallengeId<
		T extends Document = ITwoFactorChallenge,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(pendingChallengeId: string, options?: O): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ _id: pendingChallengeId }, options);
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
