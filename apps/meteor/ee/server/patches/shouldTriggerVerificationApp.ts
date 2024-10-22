import type { IOmnichannelSource, ILivechatContact } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts } from '@rocket.chat/models';

import { shouldTriggerVerificationApp } from '../../../app/livechat/server/lib/contacts/shouldTriggerVerificationApp';
import { settings } from '../../../app/settings/server';

const runShouldTriggerVerificationApp = async (
	_next: any,
	contactId: ILivechatContact['_id'],
	source: IOmnichannelSource,
): Promise<boolean> => {
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
	const verificationRequirement = settings.get<string>('Livechat_Require_Contact_Verification');

	// If the contact has never been verified and it needs to be verified at least once, trigger the app
	if (!isContactVerified && verificationRequirement === 'once') {
		return true;
	}

	// If the contact needs to re-verify for every inquiry, trigger the app
	if (verificationRequirement === 'always') {
		return true;
	}

	return false;
};

shouldTriggerVerificationApp.patch(runShouldTriggerVerificationApp, () => License.hasModule('contact-id-verification'));
