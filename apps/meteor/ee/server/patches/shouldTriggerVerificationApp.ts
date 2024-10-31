import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { type IOmnichannelSource, type ILivechatContact } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';

import { shouldTriggerVerificationApp } from '../../../app/livechat/server/lib/contacts/shouldTriggerVerificationApp';
import { settings } from '../../../app/settings/server';

/**
 * Theese are the possible values the Livechat_Require_Contact_Verification might assume, they represent:
 * - never: the contact verification app should never be triggered, therefore, the conversation will be always put onto the queue
 * - once: if the contact was already verified in this channel, there is no need to assign it to the bot again
 * - always: assign it to the bot every time
 */
type AvailableLivechatRequireContactVerificationSetting = 'never' | 'once' | 'always';

export const runShouldTriggerVerificationApp = async (
	_next: any,
	roomId: IOmnichannelRoom['_id'],
	source: IOmnichannelSource,
): Promise<boolean> => {
	const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, 'v'>>(roomId, { projection: { v: 1 } });
	if (!room) {
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

	// There is no configured verification app, so there is no reason to trigger a verification app, since
	// none will be able to be assigned
	if (settings.get<string>('Livechat_Contact_Verification_App') === '') {
		return false;
	}

	const verificationRequirement = settings.get<AvailableLivechatRequireContactVerificationSetting>('Livechat_Require_Contact_Verification');
	const isContactVerified = (contact.channels?.filter((channel) => channel.verified && channel.name === source.type) || []).length > 0;

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
