import type { ILivechatPriority } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatPriorityModel extends IBaseModel<ILivechatPriority> {
	findOneByIdOrName(_idOrName: string, options?: any): any;
}
