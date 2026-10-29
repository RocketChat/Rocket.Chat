import type { IMessage } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';

import { useMessageDisplay } from '../contexts/MessageDisplayContext';
import { useMessageRelatedData } from '../contexts/MessageRelatedDataContext';

/** Whether the viewer can reply privately to a message of a broadcast room: one written by someone else, where messages can be acted on. */
export const useCanReplyToBroadcast = (message: IMessage) => {
	const uid = useUserId();
	const { allowsInteraction } = useMessageDisplay();
	const { data: conversation } = useMessageRelatedData().useConversation(message, { enabled: allowsInteraction });
	const broadcast = conversation?.subscription?.broadcast ?? false;

	return allowsInteraction && broadcast && !!message.u.username && message.u._id !== uid;
};
