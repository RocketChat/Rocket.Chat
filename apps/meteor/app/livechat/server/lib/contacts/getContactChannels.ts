import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';
import moment from 'moment';

export async function getContactChannels(contactId: string): Promise<ILivechatContactChannel[]> {
	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, 'channels'>>(contactId, { projection: { channels: 1 } });

	if (!contact?.channels) {
		return [];
	}

	const groupedChannels = new Map<string, ILivechatContactChannel>();

	contact.channels.forEach((channel: ILivechatContactChannel) => {
		const lastChat = moment(channel.lastChat?.ts);

		const existingChannel = groupedChannels.get(channel.name);

		if (!existingChannel) {
			return groupedChannels.set(channel.name, channel);
		}

		if (lastChat.isAfter(moment(existingChannel?.lastChat?.ts))) {
			groupedChannels.set(channel.name, channel);
		}
	});

	return [...groupedChannels.values()];
}
