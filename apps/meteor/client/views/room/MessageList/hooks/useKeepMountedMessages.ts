import type { IMessage } from '@rocket.chat/core-typings';

export const useKeepMountedMessages = (messages: IMessage[]): number[] => {
	return messages
		.map((message, index) => {
			if (message.attachments?.length && message.attachments.length > 0) {
				return index;
			}
			return null;
		})
		.filter((index) => index !== null);
};
