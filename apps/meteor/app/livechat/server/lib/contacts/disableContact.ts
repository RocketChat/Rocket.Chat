import { LivechatContacts } from '@rocket.chat/models';

export async function disableContactById(contactId: string): Promise<void> {
	const contact = await LivechatContacts.findOneById(contactId);
	if (!contact) {
		throw new Error('contact-not-found');
	}

	await LivechatContacts.disableByContactId(contactId);
}
