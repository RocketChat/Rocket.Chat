import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { FindOptions, DeleteResult, FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatTagModel extends IBaseModel<ILivechatTag> {
	findInIds(ids: string[], options?: FindOptions<ILivechatTag>): FindCursor<ILivechatTag>;
	createOrUpdateTag(
		_id: string | undefined,
		{ name, description }: { name: string; description?: string },
		departments?: string[],
	): Promise<ILivechatTag>;
	removeById(_id: string): Promise<DeleteResult>;
}
