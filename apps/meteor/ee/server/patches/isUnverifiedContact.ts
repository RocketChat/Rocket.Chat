import type { AtLeast, ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

import { hasLicense } from '../../../app/license/client';
import { isUnverifiedContact } from '../../../app/livechat/server/lib/Contacts';
import { settings } from '../../../app/settings/server';

isUnverifiedContact.patch(async (_next, room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean> => {
	const hasContactIdLicense = await hasLicense('contact-id-verification');

	if (hasContactIdLicense) {
		return false;
	}

	if (!room.v.contactId) {
		return false;
	}

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'unknown' | 'channels'>>(room.v.contactId, {
		projection: {
			_id: 1,
			unknown: 1,
			channels: 1,
		},
	});

	// Sanity check, should never happen
	if (!contact) {
		return false;
	}

	if (contact.unknown && settings.get<boolean>('Livechat_Block_Unknown_Contacts')) {
		return true;
	}

	const isContactVerified =
		(contact.channels?.filter((channel) => channel.verified && channel.name === room.source?.type) || []).length > 0;

	if (!isContactVerified && settings.get<boolean>('Livechat_Block_Unverified_Contacts')) {
		return true;
	}

	if (!settings.get<boolean>('Livechat_Request_Verification_On_First_Contact_Only')) {
		return true;
	}

	return false;
});
