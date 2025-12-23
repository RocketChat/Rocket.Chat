import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';

export const findLastChatFromChannel = (channels: Serialized<ILivechatContactChannel>[] = [], providerId: string) => {
	const channel = channels.find((channel) => channel.name === providerId);
	return channel?.lastChat?.ts;
};
