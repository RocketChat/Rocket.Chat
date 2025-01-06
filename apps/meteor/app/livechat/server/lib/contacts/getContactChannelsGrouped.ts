import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

export async function getContactChannelsGrouped(contactId: string): Promise<ILivechatContactChannel[]> {
	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, 'channels'>>(contactId, { projection: { channels: 1 } });

	if (!contact?.channels) {
		return [];
	}

	const groupedChannels = new Map<string, ILivechatContactChannel>();

	contact.channels.forEach((channel: ILivechatContactChannel) => {
		const existingChannel = groupedChannels.get(channel.name);

		if (!existingChannel) {
			return groupedChannels.set(channel.name, channel);
		}

		if ((channel.lastChat?.ts?.valueOf() || 0) > (existingChannel?.lastChat?.ts?.valueOf() || 0)) {
			groupedChannels.set(channel.name, channel);
		}
	});

	return [...groupedChannels.values()];
}
