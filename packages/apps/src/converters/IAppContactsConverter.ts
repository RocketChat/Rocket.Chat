import type { ILivechatContact } from '@rocket.chat/core-typings';

import type { IAppsLivechatContact } from '../AppsEngine';

export interface IAppContactsConverter {
	convertById(contactId: ILivechatContact['_id']): Promise<IAppsLivechatContact | undefined>;

	convertContact(contact: undefined | null): Promise<undefined>;
	convertContact(contact: ILivechatContact): Promise<IAppsLivechatContact>;
	convertContact(contact: ILivechatContact | undefined | null): Promise<IAppsLivechatContact | undefined>;
	convertAppContact(contact: undefined | null): Promise<undefined>;
	convertAppContact(contact: IAppsLivechatContact): Promise<ILivechatContact>;
	convertAppContact(contact: IAppsLivechatContact | undefined | null): Promise<ILivechatContact | undefined>;
}
