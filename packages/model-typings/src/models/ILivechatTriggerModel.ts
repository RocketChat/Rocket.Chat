import type { Cursor, UpdateWriteOpResult } from 'mongodb';
import type { ILivechatTrigger } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatTriggerModel extends IBaseModel<ILivechatTrigger> {
	findEnabled(): Cursor<ILivechatTrigger>;
	updateById(_id: string, data: ILivechatTrigger): Promise<UpdateWriteOpResult>;
}
