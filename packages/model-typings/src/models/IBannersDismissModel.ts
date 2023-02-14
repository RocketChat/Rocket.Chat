import type { FindCursor, FindOptions } from 'mongodb';
import type { IBannerDismiss } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IBannersDismissModel extends IBaseModel<IBannerDismiss> {
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
	): FindCursor<P> | FindCursor<IBannerDismiss>;
}
