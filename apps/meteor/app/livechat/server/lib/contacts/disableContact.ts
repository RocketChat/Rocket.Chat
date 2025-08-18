import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatVisitors } from '@rocket.chat/models';

export async function disableContactById(contactId: string): Promise<void> {
	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'channels'>>(contactId);
	if (!contact) {
		throw new Error('error-contact-not-found');
	}
	// Cleaning up any visitor object for the contact
	for await (const channel of contact.channels) {
		await LivechatVisitors.disableById(channel.visitor.visitorId);
	}

	await LivechatContacts.disableByContactId(contactId);
}
