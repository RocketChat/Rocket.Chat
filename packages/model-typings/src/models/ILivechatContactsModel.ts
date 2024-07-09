import type { ILivechatContact } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
}
