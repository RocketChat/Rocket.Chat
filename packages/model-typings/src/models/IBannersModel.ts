import type { BannerPlatform, IBanner, Optional } from '@rocket.chat/core-typings';
import type { Document, FindCursor, FindOptions, UpdateResult, InsertOneResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IBannersModel extends IBaseModel<IBanner> {
	create(doc: Optional<IBanner, '_updatedAt'>): Promise<InsertOneResult<IBanner>>;

	findActiveByRoleOrId(roles: string[], platform: BannerPlatform, bannerId?: string, options?: FindOptions<IBanner>): FindCursor<IBanner>;

	disable(bannerId: string): Promise<UpdateResult | Document>;

	createOrUpdate(banner: Optional<IBanner, '_updatedAt'>): Promise<UpdateResult>;
}
