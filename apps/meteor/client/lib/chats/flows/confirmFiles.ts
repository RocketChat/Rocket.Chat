import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import type { ChatAPI } from '../ChatAPI';

export const confirmFiles = async (chat: ChatAPI): Promise<void> => {
	const replies = chat.composer?.quotedMessages.get() ?? [];
	const msg = chat.composer?.text || '';

	const fileUrls = chat.uploads.get().map((upload) => upload.url);
	const fileIds = chat.uploads.get().map((upload) => upload.id);

	const message = await chat.data.composeMessage(msg, {
		quotedMessages: replies,
	});

	try {
		await sdk.call('sendMessage', message, fileUrls, fileIds);
		chat.composer?.clear();
		chat?.uploads.clear();
	} catch (error: unknown) {
		console.error(error);
	}
};
