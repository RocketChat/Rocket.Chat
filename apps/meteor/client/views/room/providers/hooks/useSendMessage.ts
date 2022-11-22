import { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import { getRandomId } from '../../../../../lib/random';
import { onClientBeforeSendMessage } from '../../../../lib/onClientBeforeSendMessage';
import { ChatAPI } from '../../contexts/ChatContext';

export const useSendMessage = ({
	chatMessages,
	rid,
	tmid,
}: {
	/** @deprecated bad coupling */
	chatMessages: ChatMessages;
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
}): ChatAPI['sendMessage'] => {
	const sendMessage = useMethod('sendMessage');

	return useCallback(
		async (text: string): Promise<void> => {
			if (!text) {
				return;
			}

			const msgObject = (await onClientBeforeSendMessage({ _id: getRandomId(), rid, tmid, msg: text } as IMessage)) as IMessage;

			if (await chatMessages.slashCommandProcessor?.process(msgObject)) {
				return;
			}

			await sendMessage(msgObject);
		},
		[chatMessages.slashCommandProcessor, rid, sendMessage, tmid],
	);
};
