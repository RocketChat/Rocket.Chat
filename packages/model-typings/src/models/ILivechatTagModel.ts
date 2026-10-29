import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatTagModel extends IBaseModel<ILivechatTag> {
	createOrUpdateTag(
		_id: string | undefined,
		{ name, description }: { name: string; description?: string },
		departments?: string[],
	): Promise<Omit<ILivechatTag, '_updatedAt'>>;
	removeById(_id: string): Promise<DeleteResult>;
}
