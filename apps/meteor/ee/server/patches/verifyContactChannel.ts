import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';

import { verifyContactChannel, mergeContacts } from '../../../app/livechat/server/lib/Contacts';

export const runVerifyContactChannel = async (
	_next: any,
	params: {
		contactId: string;
		field: string;
		value: string;
		channelName: string;
		visitorId: string;
		roomId: string;
	},
): Promise<ILivechatContact | null> => {
	const { contactId, field, value, channelName, visitorId, roomId } = params;

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'channels'>>(contactId, {
		projection: { _id: 1, channels: 1 },
	});

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	const channel = contact.channels?.find(
		(channel: ILivechatContactChannel) => channel.name === channelName && channel.visitorId === visitorId,
	);

	if (!channel) {
		throw new Error('error-invalid-channel');
	}

	channel.verified = true;
	channel.verifiedAt = new Date();
	channel.field = field;
	channel.value = value;

	await LivechatContacts.updateContact(contactId, {
		channels: contact.channels,
	});

	await LivechatRooms.update({ _id: roomId }, { $set: { verified: true } });

	return mergeContacts(contactId, channel);
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
