import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatContacts } from '@rocket.chat/models';

import { mergeContacts } from '../../../../../app/livechat/server/lib/Contacts';
import { callbacks } from '../../../../../lib/callbacks';

type VerifyContactChannelParams = {
	contactId: string;
	field: string;
	value: string;
	channelName: string;
	visitorId: string;
	roomId: string;
};

export const verifyContactChannel = async (params: VerifyContactChannelParams): Promise<ILivechatContact | null> => {
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

callbacks.add('contact-id-verification.verifyContactChannel', verifyContactChannel, callbacks.priority.HIGH, 'verify-contact-channel');
