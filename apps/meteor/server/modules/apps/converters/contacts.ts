import type { IAppContactsConverter, IAppsLivechatContact } from '@rocket.chat/apps';
import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';
import * as z from 'zod';

import { ContactCodec } from './codecs/contacts';

export class AppContactsConverter implements IAppContactsConverter {
	async convertById(contactId: ILivechatContact['_id']): Promise<IAppsLivechatContact | undefined> {
		const contact = await LivechatContacts.findOneEnabledById(contactId);
		if (!contact) {
			return;
		}

		return this.convertContact(contact);
	}

	async convertContact(contact: undefined | null): Promise<undefined>;

	async convertContact(contact: ILivechatContact): Promise<IAppsLivechatContact>;

	async convertContact(contact: ILivechatContact | undefined | null): Promise<IAppsLivechatContact | undefined> {
		if (!contact) {
			return;
		}

		return z.decodeAsync(ContactCodec, contact);
	}

	convertAppContact(contact: undefined | null): Promise<undefined>;

	convertAppContact(contact: IAppsLivechatContact): Promise<ILivechatContact>;

	async convertAppContact(contact: IAppsLivechatContact | undefined | null): Promise<ILivechatContact | undefined> {
		if (!contact) {
			return;
		}

		return z.encodeAsync(ContactCodec, contact);
	}
}
