import type { ILivechatContact, IOmnichannelSource } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts } from '@rocket.chat/models';

import { isAgentAvailableToTakeContactInquiry } from '../../../app/livechat/server/lib/contacts/isAgentAvailableToTakeContactInquiry';
import { settings } from '../../../app/settings/server';

// If the contact is unknown and the setting to block unknown contacts is on, we must not allow the agent to take this inquiry
// if the contact is not verified in this channel and the block unverified contacts setting is on, we should not allow the inquiry to be taken
// otherwise, the contact is allowed to be taken
const runIsAgentAvailableToTakeContactInquiry = async (
	_next: any,
	source: IOmnichannelSource,
	contactId: ILivechatContact['_id'] | null,
): Promise<{ error: string; value: false } | { value: true }> => {
	if (!contactId) {
		return { value: false, error: 'error-invalid-contact' };
	}

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'unknown' | 'channels'>>(contactId, {
		projection: {
			_id: 1,
			unknown: 1,
			channels: 1,
		},
	});

	if (!contact) {
		return { value: false, error: 'error-invalid-contact' };
	}

	if (contact.unknown && settings.get<boolean>('Livechat_Block_Unknown_Contacts')) {
		return { value: false, error: 'error-unknown-contact' };
	}

	const isContactVerified = (contact.channels?.filter((channel) => channel.verified && channel.name === source.type) || []).length > 0;
	if (!isContactVerified && settings.get<boolean>('Livechat_Block_Unverified_Contacts')) {
		return { value: false, error: 'error-unverified-contact' };
	}

	return { value: true };
};

isAgentAvailableToTakeContactInquiry.patch(runIsAgentAvailableToTakeContactInquiry, () => License.hasModule('contact-id-verification'));
