import crypto from 'crypto';

import type { ISamlUsedAssertions, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ISamlUsedAssertionsModel } from '@rocket.chat/model-typings';
import type { MongoServerError, Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const DUPLICATE_KEY_ERROR_CODE = 11000;

export class SamlUsedAssertionsRaw extends BaseRaw<ISamlUsedAssertions> implements ISamlUsedAssertionsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ISamlUsedAssertions>>) {
		super(db, 'saml_used_assertions', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { expireAt: 1 }, sparse: true, expireAfterSeconds: 0 }];
	}

	async markUsed(assertionId: string, issuer: string, expireAt: Date): Promise<boolean> {
		try {
			await this.insertOne({
				_id: crypto.createHash('sha256').update(JSON.stringify({ issuer, assertionId })).digest('hex'),
				assertionId,
				issuer,
				expireAt,
				createdAt: new Date(),
			});
			return true;
		} catch (error: unknown) {
			if (typeof error === 'object' && error !== null && (error as MongoServerError).code === DUPLICATE_KEY_ERROR_CODE) {
				return false;
			}
			throw error;
		}
	}
}
