import { Omnichannel } from '@rocket.chat/core-services';
import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatRooms, LivechatContacts } from '@rocket.chat/models';

import { OmnichannelService } from '../../../../../server/services/omnichannel/service';

await License.overwriteClassOnLicense('chat.rocket.contact-id-verification', OmnichannelService, {
	async verifyContactChannel(params: {
		contactId: string;
		field: string;
		value: string;
		channelName: string;
		visitorId: string;
		roomId: string;
	}): Promise<ILivechatContact | null> {
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

		return Omnichannel.mergeContacts(contactId, channel);
	},
});
