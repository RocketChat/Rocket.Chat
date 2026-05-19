import type { IMessage } from '@rocket.chat/core-typings';

export const useKeepMountedMessages = (messages: IMessage[], canPreview: boolean = false): number[] => {
	const offset = canPreview ? 1 : 0;
	return messages.reduce<number[]>((acc, message, index) => {
		if (message.files?.length && message.files.length > 0) {
			acc.push(index + offset);
		}
		return acc;
	}, []);
};
