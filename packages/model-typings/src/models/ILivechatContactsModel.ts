import type { ILivechatContact } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
	findVerifiedContactByEmail<T>(email: string, options?: FindOptions<ILivechatContact>): Promise<ILivechatContact | T | null>;
}
