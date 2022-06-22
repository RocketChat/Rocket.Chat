import type { Cursor, FindOneOptions, UpdateWriteOpResult, WithoutProjection, InsertOneWriteOpResult } from 'mongodb';
import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IBannersModel extends IBaseModel<IBanner> {
	create(doc: IBanner): Promise<InsertOneWriteOpResult<IBanner>>;
	findActiveByRoleOrId(
		roles: string[],
		platform: BannerPlatform,
		bannerId?: string,
		options?: WithoutProjection<FindOneOptions<IBanner>>,
	): Cursor<IBanner>;
	disable(bannerId: string): Promise<UpdateWriteOpResult>;
}
