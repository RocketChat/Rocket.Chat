import { LivechatContacts } from '@rocket.chat/models';

export async function disableContactById(contactId: string): Promise<void> {
	const updatedContact = await LivechatContacts.disableByContactId(contactId);
	if (updatedContact.matchedCount === 0) {
		throw new Error('error-contact-not-found');
	}
}
