import type { IMessage } from '@rocket.chat/core-typings';

export const useKeepMountedMessages = (messages: IMessage[], canPreview: boolean): number[] => {
	return messages
		.map((message, index) => {
			if (message.attachments?.length && message.attachments.length > 0) {
				return index + (canPreview ? 1 : 0);
			}
			return null;
		})
		.filter((index) => index !== null);
};
