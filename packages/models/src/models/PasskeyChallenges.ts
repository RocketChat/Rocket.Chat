import type { IPasskeyChallenge, IUser } from '@rocket.chat/core-typings';
import type { IPasskeyChallengesModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class PasskeyChallengesRaw extends BaseRaw<IPasskeyChallenge> implements IPasskeyChallengesModel {
	constructor(db: Db) {
		super(db, 'passkey_challenges');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { expireAt: 1 }, expireAfterSeconds: 0 }];
	}

	async createChallenge({
		challenge,
		...fields
	}: { challenge: IPasskeyChallenge['_id']; expireAt: IPasskeyChallenge['expireAt'] } & (
		{ purpose: 'registration'; userId: IUser['_id'] } | { purpose: 'authentication' }
	)): Promise<void> {
		await this.insertOne({ _id: challenge, ...fields, createdAt: new Date() });
	}

	findOneNotExpiredForAuthenticationAndDelete(challenge: IPasskeyChallenge['_id']): Promise<IPasskeyChallenge | null> {
		return this.findOneAndDelete({
			_id: challenge,
			purpose: 'authentication',
			expireAt: { $gt: new Date() },
		});
	}

	findOneNotExpiredForRegistrationByUserIdAndDelete(
		challenge: IPasskeyChallenge['_id'],
		userId: IUser['_id'],
	): Promise<IPasskeyChallenge | null> {
		return this.findOneAndDelete({
			_id: challenge,
			purpose: 'registration',
			userId,
			expireAt: { $gt: new Date() },
		});
	}
}
