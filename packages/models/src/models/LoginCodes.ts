import { randomBytes } from 'crypto';

import type { ILoginCode } from '@rocket.chat/core-typings';
import type { ILoginCodesModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const CODE_TTL_MS = 60 * 1000;

export class LoginCodesRaw extends BaseRaw<ILoginCode> implements ILoginCodesModel {
	constructor(db: Db) {
		super(db, 'login_codes');
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { expireAt: 1 }, expireAfterSeconds: 0 }];
	}

	async createCode(userId: string): Promise<string> {
		const now = new Date();
		const code = randomBytes(32).toString('hex');
		await this.insertOne({
			_id: code,
			userId,
			createdAt: now,
			expireAt: new Date(now.getTime() + CODE_TTL_MS),
		});
		return code;
	}

	findOneNotExpiredByCodeAndDelete(code: string): Promise<ILoginCode | null> {
		return this.findOneAndDelete({
			_id: code,
			expireAt: { $gt: new Date() },
		});
	}

	removeByCode(code: string): Promise<DeleteResult> {
		return this.deleteOne({ _id: code });
	}
}
