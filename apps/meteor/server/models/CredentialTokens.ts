import { IndexSpecification } from 'mongodb';
import { ICredentialToken } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class CredentialTokens extends ModelClass<ICredentialToken> {
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
