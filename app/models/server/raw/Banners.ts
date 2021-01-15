// import { FindOneOptions, Cursor, UpdateQuery, FilterQuery } from 'mongodb';
import { Cursor, FindOneOptions } from 'mongodb';

import { BannerPlatform, IBanner } from '../../../../definition/IBanner';
import { BaseRaw } from './BaseRaw';

type T = IBanner;
export class BannersRaw extends BaseRaw<T> {
	findActiveByRoleAndPlatformExcluding(roles: string[], platform: BannerPlatform, excluding: string[], options?: FindOneOptions<T>): Cursor<T> {
		const today = new Date();
		today.setHours(0);
		today.setMinutes(0);
		today.setSeconds(0);

		const query = {
			...excluding && { _id: { $nin: excluding } },
			platform,
			startAt: { $lte: today },
			expireAt: { $gte: today },
			$or: [
				{ roles: { $in: roles } },
				{ roles: { $exists: false } },
			],
		};

		return this.col.find(query, options);
	}
}
