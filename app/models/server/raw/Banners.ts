import { Collection, Cursor, FindOneOptions, WithoutProjection } from 'mongodb';

import { BannerPlatform, IBanner } from '../../../../definition/IBanner';
import { BaseRaw } from './BaseRaw';

type T = IBanner;
export class BannersRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndexes([
			{ key: { platform: 1, startAt: 1, expireAt: 1 } },
		]);
	}

	findActiveByRoleOrId(roles: string[], platform: BannerPlatform, bannerId?: string, options?: WithoutProjection<FindOneOptions<T>>): Cursor<T> {
		const today = new Date();

		const query = {
			...bannerId && { _id: bannerId },
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
