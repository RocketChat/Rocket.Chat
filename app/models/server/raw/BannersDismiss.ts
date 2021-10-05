import { Collection, Cursor, FindOneOptions } from 'mongodb';

import { IBannerDismiss } from '../../../../definition/IBanner';
import { BaseRaw } from './BaseRaw';

type T = IBannerDismiss;
export class BannersDismissRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndexes([
			{ key: { userId: 1, bannerId: 1 } },
		]);
	}

	findByUserIdAndBannerId(userId: string, bannerIds: string[], options?: FindOneOptions<T>): Cursor<T> {
		const query = {
			userId,
			bannerId: { $in: bannerIds },
		};

		return this.col.find(query, options);
	}
}
