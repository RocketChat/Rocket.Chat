import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { FindOptions, DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatTagModel extends IBaseModel<ILivechatTag> {
	findOneById(_id: string, options: FindOptions<ILivechatTag>): Promise<ILivechatTag | null>;
	createOrUpdateTag(
		_id: string,
		{ name, description }: Pick<ILivechatTag, 'name' | 'description'>,
		departments: string[],
	): Promise<ILivechatTag>;
	removeById(_id: string): Promise<DeleteResult>;
}
