import type { Document, FindCursor, FindOptions, UpdateResult, InsertOneResult } from 'mongodb';
import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IBannersModel extends IBaseModel<IBanner> {
	create(doc: IBanner): Promise<InsertOneResult<IBanner>>;

	findActiveByRoleOrId(roles: string[], platform: BannerPlatform, bannerId?: string, options?: FindOptions<IBanner>): FindCursor<IBanner>;

	disable(bannerId: string): Promise<UpdateResult | Document>;
}
