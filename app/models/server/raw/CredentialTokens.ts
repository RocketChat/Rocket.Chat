import { BaseRaw, IndexSpecification } from './BaseRaw';
import { ICredentialToken as T } from '../../../../definition/ICredentialToken';

export class CredentialTokensRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [{ key: { expireAt: 1 }, sparse: true, expireAfterSeconds: 0 }];

	async create(_id: string, userInfo: T['userInfo']): Promise<T> {
		const validForMilliseconds = 60000; // Valid for 60 seconds
		const token = {
			_id,
			userInfo,
			expireAt: new Date(Date.now() + validForMilliseconds),
		};

		await this.insertOne(token);
		return token;
	}

	findOneNotExpiredById(_id: string): Promise<T | null> {
		const query = {
			_id,
			expireAt: { $gt: new Date() },
		};

		return this.findOne(query);
	}
}
