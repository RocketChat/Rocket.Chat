import type { IMessage, ISubscription, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import type { MessageListMessageRow } from '@rocket.chat/ui-message-list';
import { SystemMessage, ThreadMessage } from '@rocket.chat/ui-message-list';
import { memo } from 'react';

type ThreadMessageRowProps = {
	row: MessageListMessageRow<IMessage>;
	subscription: ISubscription | undefined;
};

/** A message of the thread: its main message first, then the replies. */
const ThreadMessageRow = ({ row: { message, isSequential, isFirstUnread }, subscription }: ThreadMessageRowProps) => {
	if (MessageTypes.isSystemMessage(message)) {
		return <SystemMessage message={message} />;
	}

	return (
		<ThreadMessage
			message={message as IThreadMessage | IThreadMainMessage}
			sequential={isSequential}
			unread={isFirstUnread}
			ignoredUser={!!subscription?.ignored?.includes(message.u._id) || !!(message as { ignored?: boolean }).ignored}
		/>
	);
};

export default memo(ThreadMessageRow);
