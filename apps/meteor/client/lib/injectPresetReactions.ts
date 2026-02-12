import type { AtLeast, IMessage } from '@rocket.chat/core-typings';

import { getPresetReactions, clearPresetReactions } from './chats/presetReactionsStore';
import { onClientBeforeSendMessage } from './onClientBeforeSendMessage';

onClientBeforeSendMessage.use(async (message: AtLeast<IMessage, '_id' | 'rid' | 'msg'> & { isEditing?: boolean }) => {
	const presetReactions = getPresetReactions(message.rid);

	if (presetReactions.length > 0 && !message.isEditing) {
		// Clear preset reactions after getting them (they should only apply to the next message)
		clearPresetReactions(message.rid);

		return {
			...message,
			presetReactions,
		} as IMessage;
	}

	return message;
});
