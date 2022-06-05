import type { Cursor, FindOneOptions, WithoutProjection } from 'mongodb';
import { IndexSpecification } from 'mongodb';
import type { IBannerDismiss } from '@rocket.chat/core-typings';
import type { IBannersDismissModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class BannersDismissRaw extends ModelClass<IBannerDismiss> implements IBannersDismissModel {
	modelIndexes(): IndexSpecification[] {
		return [{ key: { userId: 1, bannerId: 1 } }];
	}

	findByUserIdAndBannerId(userId: string, bannerIds: string[]): Cursor<IBannerDismiss>;

	findByUserIdAndBannerId(
		userId: string,
		bannerIds: string[],
		options: WithoutProjection<FindOneOptions<IBannerDismiss>>,
	): Cursor<IBannerDismiss>;

	findByUserIdAndBannerId<P>(
		userId: string,
		bannerIds: string[],
		options: FindOneOptions<P extends IBannerDismiss ? IBannerDismiss : P>,
	): Cursor<P>;

	findByUserIdAndBannerId<P>(
		userId: string,
		bannerIds: string[],
		options?: undefined | WithoutProjection<FindOneOptions<IBannerDismiss>> | FindOneOptions<P extends IBannerDismiss ? IBannerDismiss : P>,
	): Cursor<P> | Cursor<IBannerDismiss> {
		const query = {
			userId,
			bannerId: { $in: bannerIds },
		};

		return options ? this.col.find(query, options) : this.col.find(query);
	}
}
