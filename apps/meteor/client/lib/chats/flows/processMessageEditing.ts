import type { IMessage } from '@rocket.chat/core-typings';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

export const processMessageEditing = async (
	chat: ChatAPI,
	message: Pick<IMessage, '_id' | 't'> & Partial<Omit<IMessage, '_id' | 't'>>,
): Promise<boolean> => {
	if (!chat.currentEditing) {
		return false;
	}

	if (MessageTypes.isSystemMessage(message)) {
		return false;
	}

	if (!message.msg && !message.attachments?.length) {
		return false;
	}

	try {
		await chat.data.updateMessage({ ...message, _id: chat.currentEditing.mid });
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });
	}

	chat.currentEditing.stop();

	return true;
};
