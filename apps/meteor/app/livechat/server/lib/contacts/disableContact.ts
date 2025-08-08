import { LivechatContacts } from '@rocket.chat/models';

import { settings } from '../../../../settings/server';

export async function disableContactById(contactId: string): Promise<void> {
	if (!settings.get('Omnichannel_enable_contact_removal')) {
		throw new Error('error-contact-removal-disabled');
	}

	const contact = await LivechatContacts.findOneById(contactId);
	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	await LivechatContacts.disableByContactId(contactId);
}
