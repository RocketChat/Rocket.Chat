import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import type { ChatAPI } from '../ChatAPI';

export const confirmFiles = async (chat: ChatAPI): Promise<void> => {
	const replies = chat.composer?.quotedMessages.get() ?? [];
	const msg = chat.composer?.text || '';

	const message = await chat.data.composeMessage(msg, {
		quotedMessages: replies,
	});

	const store = message?.tmid ? chat.threadUploads : chat.uploads;

	const fileUrls = store.get().map((upload) => upload.url);
	const fileIds = store.get().map((upload) => upload.id);

	try {
		await sdk.call('sendMessage', message, fileUrls, fileIds);
		chat.composer?.clear();
		store.clear();
	} catch (error: unknown) {
		console.error(error);
	}
};
