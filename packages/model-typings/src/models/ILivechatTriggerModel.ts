import type { FindCursor, UpdateResult } from 'mongodb';
import type { ILivechatTrigger } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatTriggerModel extends IBaseModel<ILivechatTrigger> {
	findEnabled(): FindCursor<ILivechatTrigger>;
	updateById(_id: string, data: ILivechatTrigger): Promise<UpdateResult>;
}
