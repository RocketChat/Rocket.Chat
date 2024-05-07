import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { ModifyResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatPriorityModel extends IBaseModel<ILivechatPriority> {
	findOneByIdOrName(_idOrName: string, options?: any): Promise<ILivechatPriority | null>;
	findOneNameUsingRegex(_idOrName: string, options?: any): Promise<ILivechatPriority | null>;
	canResetPriorities(): Promise<boolean>;
	resetPriorities(): Promise<void>;
	updatePriority(_id: string, reset: boolean, name?: string): Promise<ModifyResult<ILivechatPriority>>;
}
