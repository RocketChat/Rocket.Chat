import { Collection, Cursor, FindOneOptions, WithoutProjection } from 'mongodb';

import { IBannerDismiss } from '../../../../definition/IBanner';
import { BaseRaw } from './BaseRaw';

export class BannersDismissRaw extends BaseRaw<IBannerDismiss> {
	constructor(
		public readonly col: Collection<IBannerDismiss>,
		public readonly trash?: Collection<IBannerDismiss>,
	) {
		super(col, trash);

		this.col.createIndexes([
			{ key: { userId: 1, bannerId: 1 } },
		]);
	}

	findByUserIdAndBannerId(userId: string, bannerIds: string[]): Cursor<IBannerDismiss>;

	findByUserIdAndBannerId(userId: string, bannerIds: string[], options: WithoutProjection<FindOneOptions<IBannerDismiss>>): Cursor<IBannerDismiss>;

	findByUserIdAndBannerId<P>(userId: string, bannerIds: string[], options: FindOneOptions<P extends IBannerDismiss ? IBannerDismiss : P>): Cursor<P>;

	findByUserIdAndBannerId<P>(userId: string, bannerIds: string[], options?: undefined | WithoutProjection<FindOneOptions<IBannerDismiss>> | FindOneOptions<P extends IBannerDismiss ? IBannerDismiss : P>): Cursor<P> | Cursor<IBannerDismiss> {
		const query = {
			userId,
			bannerId: { $in: bannerIds },
		};

		return options ? this.col.find(query, options) : this.col.find(query);
	}
}
