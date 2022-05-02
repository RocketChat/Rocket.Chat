import { Cursor, FindOneOptions, UpdateWriteOpResult, WithoutProjection, InsertOneWriteOpResult } from 'mongodb';
import { BannerPlatform, IBanner } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

type T = IBanner;
export class BannersRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { platform: 1, startAt: 1, expireAt: 1 } }, { key: { platform: 1, startAt: 1, expireAt: 1, active: 1 } }];
	}

	create(doc: IBanner): Promise<InsertOneWriteOpResult<IBanner>> {
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

	findActiveByRoleOrId(
		roles: string[],
		platform: BannerPlatform,
		bannerId?: string,
		options?: WithoutProjection<FindOneOptions<T>>,
	): Cursor<T> {
		const today = new Date();

		const query = {
			...(bannerId && { _id: bannerId }),
			platform,
			startAt: { $lte: today },
			expireAt: { $gte: today },
			active: { $ne: false },
			$or: [{ roles: { $in: roles } }, { roles: { $exists: false } }],
		};

		return this.col.find(query, options);
	}

	disable(bannerId: string): Promise<UpdateWriteOpResult> {
		return this.col.updateOne({ _id: bannerId, active: { $ne: false } }, { $set: { active: false, inactivedAt: new Date() } });
	}
}
