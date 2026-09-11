import type { BannerPlatform, IBanner, Optional } from '@rocket.chat/core-typings';
import type { Document, FindCursor, UpdateResult, InsertOneResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IBannersModel extends IBaseModel<IBanner> {
	create(doc: Optional<IBanner, '_updatedAt'>): Promise<InsertOneResult<IBanner>>;

	findActiveByRoleOrId<T extends Document = IBanner, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roles: string[],
		platform: BannerPlatform,
		bannerId?: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	disable(bannerId: string): Promise<UpdateResult | Document>;

	createOrUpdate(banner: Optional<IBanner, '_updatedAt'>): Promise<UpdateResult>;

	findByIds(bannerIds: string[]): FindCursor<IBanner>;
}
