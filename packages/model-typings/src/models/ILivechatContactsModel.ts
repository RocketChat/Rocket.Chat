import type { ILivechatContact } from '@rocket.chat/core-typings';
import type { ModifyResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	upsertContact(contactId: string, data: Partial<ILivechatContact>): Promise<ModifyResult<ILivechatContact>>;
	updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
}
