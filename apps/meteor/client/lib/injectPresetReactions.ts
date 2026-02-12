import type { AtLeast, IMessage } from '@rocket.chat/core-typings';

import { onClientBeforeSendMessage } from '../onClientBeforeSendMessage';
import { getPresetReactions, clearPresetReactions } from './chats/presetReactionsStore';

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
