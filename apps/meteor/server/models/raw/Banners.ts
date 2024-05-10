import type { IBanner, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { BannerPlatform } from '@rocket.chat/core-typings';
import type { IBannersModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, FindOptions, IndexDescription, InsertOneResult, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class BannersRaw extends BaseRaw<IBanner> implements IBannersModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IBanner>>) {
		super(db, 'banner', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { platform: 1, startAt: 1, expireAt: 1 } }, { key: { platform: 1, startAt: 1, expireAt: 1, active: 1 } }];
	}

	create(doc: IBanner): Promise<InsertOneResult<IBanner>> {
		const invalidPlatform = doc.platform?.some((platform) => !Object.values(BannerPlatform).includes(platform));
		if (invalidPlatform) {
			throw new Error('Invalid platform');
		}

		if (doc.startAt > doc.expireAt) {
			throw new Error('Start date cannot be later than expire date');
		}

		if (doc.expireAt < new Date()) {
			throw new Error('Cannot create banner already expired');
		}

		return this.insertOne({
			active: true,
			...doc,
		});
	}

	findActiveByRoleOrId(roles: string[], platform: BannerPlatform, bannerId?: string, options?: FindOptions<IBanner>): FindCursor<IBanner> {
		const today = new Date();

		const query = {
			...(bannerId && { _id: bannerId }),
			platform,
			startAt: { $lte: today },
			expireAt: { $gte: today },
			active: { $ne: false },
			$or: [{ roles: { $in: roles } }, { roles: { $exists: false } }],
		};

		return this.find(query, options);
	}

	disable(bannerId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: bannerId, active: { $ne: false } }, { $set: { active: false, inactivedAt: new Date() } });
	}

	createOrUpdate(banner: IBanner): Promise<UpdateResult> {
		const invalidPlatform = banner.platform?.some((platform) => !Object.values(BannerPlatform).includes(platform));
		if (invalidPlatform) {
			throw new Error('Invalid platform');
		}

		if (banner.startAt > banner.expireAt) {
			throw new Error('Start date cannot be later than expire date');
		}

		if (banner.expireAt < new Date()) {
			throw new Error('Cannot create banner already expired');
		}

		const { _id: bannerId, ...doc } = banner;

		return this.updateOne({ _id: bannerId }, { $set: { active: true, ...doc } }, { upsert: true });
	}
}
