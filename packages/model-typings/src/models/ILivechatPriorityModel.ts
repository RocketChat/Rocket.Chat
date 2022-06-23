import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatPriorityModel extends IBaseModel<IRocketChatRecord> {
	findOneByIdOrName(_idOrName: string, options?: any): any;
}
