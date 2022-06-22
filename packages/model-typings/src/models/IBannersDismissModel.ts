import type { Cursor, FindOneOptions, WithoutProjection } from 'mongodb';
import type { IBannerDismiss } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IBannersDismissModel extends IBaseModel<IBannerDismiss> {
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
	): Cursor<P> | Cursor<IBannerDismiss>;
}
