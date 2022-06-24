import type { ICredentialToken, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICredentialTokensModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexSpecification } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class CredentialTokensRaw extends BaseRaw<ICredentialToken> implements ICredentialTokensModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICredentialToken>>) {
		super(db, getCollectionName('credential_tokens'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { expireAt: 1 }, sparse: true, expireAfterSeconds: 0 }];
	}

	async create(_id: string, userInfo: ICredentialToken['userInfo']): Promise<ICredentialToken> {
		const validForMilliseconds = 60000; // Valid for 60 seconds
		const token = {
			_id,
			userInfo,
			expireAt: new Date(Date.now() + validForMilliseconds),
		};

		await this.insertOne(token);
		return token;
	}

	findOneNotExpiredById(_id: string): Promise<ICredentialToken | null> {
		const query = {
			_id,
			expireAt: { $gt: new Date() },
		};

		return this.findOne(query);
	}
}
