import { IMessage } from '@rocket.chat/core-typings';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { dispatchToastMessage } from '../../toast';
import { ChatAPI } from '../ChatAPI';

export const processMessageEditing = async (
	chat: ChatAPI,
	message: Pick<IMessage, '_id' | 't'> & Partial<Omit<IMessage, '_id' | 't'>>,
): Promise<boolean> => {
	if (!message._id) {
		return false;
	}

	if (MessageTypes.isSystemMessage(message)) {
		return false;
	}

	if (!message.msg && !message.attachments?.length) {
		return false;
	}

	try {
		await chat.data.updateMessage(message);
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });
	}

	return true;
};
