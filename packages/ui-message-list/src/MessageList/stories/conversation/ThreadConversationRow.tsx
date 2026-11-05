import type { IMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';

import SystemMessage from '../../../Message/variants/SystemMessage';
import ThreadMessage from '../../../Message/variants/ThreadMessage';
import type { MessageListMessageRow } from '../../lib/buildMessageListRows';

export type ThreadConversationRowProps = {
	row: MessageListMessageRow<IMessage>;
};

/** Renders a thread's message row: the main message first, then the replies. */
const ThreadConversationRow = ({ row }: ThreadConversationRowProps) =>
	MessageTypes.isSystemMessage(row.message) ? (
		<SystemMessage message={row.message} />
	) : (
		<ThreadMessage message={row.message as IThreadMessage} sequential={row.isSequential} unread={row.isFirstUnread} />
	);

export default ThreadConversationRow;
