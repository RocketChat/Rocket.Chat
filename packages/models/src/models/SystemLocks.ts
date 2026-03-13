import { randomUUID } from 'crypto';

import type { ISystemLock } from '@rocket.chat/core-typings';
import type { ISystemLocksModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class SystemLocksRaw extends BaseRaw<ISystemLock> implements ISystemLocksModel {
	constructor(db: Db) {
		super(db, 'system_locks', undefined, {
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	async acquireLock(key: string, staleLockThresholdMinutes = 5): Promise<{ acquired: boolean; record?: ISystemLock }> {
		const now = new Date();
		const staleThreshold = new Date();
		staleThreshold.setMinutes(staleThreshold.getMinutes() - staleLockThresholdMinutes);
		const lockKey = randomUUID();

		try {
			const record = await this.col.findOneAndUpdate(
				{
					_id: key,
					$or: [{ locked: false }, { lockedAt: { $lt: staleThreshold } }],
				},
				{
					$set: {
						locked: true,
						lockKey,
						lockedAt: now,
					},
				},
				{ upsert: true, returnDocument: 'after' },
			);

			if (record) {
				return { acquired: true, record };
			}

			return { acquired: false };
		} catch (error: any) {
			// Duplicate key error means another instance won the upsert race
			if (error?.code === 11000) {
				return { acquired: false };
			}
			throw error;
		}
	}

	async renewLockThreshold(key: string, lockKey: string): Promise<void> {
		await this.col.updateOne(
			{ _id: key, locked: true, lockKey },
			{
				$set: {
					lockedAt: new Date(),
				},
			},
		);
	}

	async releaseLock(key: string, lockKey: string, extraData?: Record<string, unknown>): Promise<void> {
		await this.col.updateOne(
			{ _id: key, lockKey },
			{
				$set: {
					locked: false,
					...(extraData && { extraData }),
				},
				$unset: {
					lockKey: 1 as const,
				},
			},
		);
	}
}
