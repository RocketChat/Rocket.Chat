import type { IBannerDismiss, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IBannersDismissModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class BannersDismissRaw extends BaseRaw<IBannerDismiss> implements IBannersDismissModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IBannerDismiss>>) {
		super(db, 'banner_dismiss', trash);
	}

	modelIndexes(): IndexDescription[] {
		return [{ key: { userId: 1, bannerId: 1 } }];
	}

	findByUserIdAndBannerId(userId: string, bannerIds: string[]): FindCursor<IBannerDismiss>;

	findByUserIdAndBannerId(userId: string, bannerIds: string[], options: FindOptions<IBannerDismiss>): FindCursor<IBannerDismiss>;

	findByUserIdAndBannerId<P>(
		userId: string,
		bannerIds: string[],
		options: FindOptions<P extends IBannerDismiss ? IBannerDismiss : P>,
	): FindCursor<P>;

	findByUserIdAndBannerId<P>(
		userId: string,
		bannerIds: string[],
		options?: undefined | FindOptions<IBannerDismiss> | FindOptions<P extends IBannerDismiss ? IBannerDismiss : P>,
	): FindCursor<P> | FindCursor<IBannerDismiss> {
		const query = {
			userId,
			bannerId: { $in: bannerIds },
		};

		return options ? this.col.find(query, options) : this.col.find(query);
	}
}
