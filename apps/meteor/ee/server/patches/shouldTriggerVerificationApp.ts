import type { IOmnichannelSource, ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

import { hasLicense } from '../../../app/license/client';
import { shouldTriggerVerificationApp } from '../../../app/livechat/server/lib/Contacts';
import { settings } from '../../../app/settings/server';

shouldTriggerVerificationApp.patch(async (_next, contactId: ILivechatContact['_id'], source: IOmnichannelSource): Promise<boolean> => {
	const hasContactIdLicense = await hasLicense('contact-id-verification');

	if (hasContactIdLicense) {
		return false;
	}

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'unknown' | 'channels'>>(contactId, {
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

	const isContactVerified = (contact.channels?.filter((channel) => channel.verified && channel.name === source.type) || []).length > 0;

	if (!isContactVerified && settings.get<boolean>('Livechat_Block_Unverified_Contacts')) {
		return true;
	}

	if (!settings.get<boolean>('Livechat_Request_Verification_On_First_Contact_Only')) {
		return true;
	}

	return false;
});
