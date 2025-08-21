import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';

import { settings } from '../../../../settings/server';
import { removeGuest } from '../guests';

export async function disableContactById(contactId: string): Promise<void> {
	const contact = await LivechatContacts.findOneEnabledById<Pick<ILivechatContact, '_id' | 'channels'>>(contactId);
	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	// Checking if the contact has any open channel/room before removing its data.
	const contactOpenRooms = await LivechatRooms.countOpenByContact(contactId);
	if (contactOpenRooms > 0 && !settings.get<boolean>('Livechat_Allow_collect_and_store_HTTP_header_informations')) {
		throw new Error('error-contact-has-open-rooms');
	}

	// Cleaning contact/visitor data;
	await Promise.all(contact.channels.map((channel) => removeGuest({ _id: channel.visitor.visitorId })));

	await LivechatContacts.disableByContactId(contactId);
}
