import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import type { FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatTriggerModel extends IBaseModel<ILivechatTrigger> {
	findEnabled(): FindCursor<ILivechatTrigger>;
	updateById(_id: string, data: Omit<ILivechatTrigger, '_id' | '_updatedAt'>): Promise<UpdateResult>;
}
