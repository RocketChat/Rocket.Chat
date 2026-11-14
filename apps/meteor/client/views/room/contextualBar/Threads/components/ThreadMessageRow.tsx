import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { SystemMessage, ThreadMessage } from '@rocket.chat/ui-message-list';
import { memo } from 'react';

import { useMessageMarkers } from '../../../../../providers/MessagesProvider/MessageMarkers';

type ThreadMessageRowProps = {
	message: IMessage;
	isSequential: boolean;
	isFirstUnread: boolean;
};

/** A message of the thread: its main message first, then the replies. */
const ThreadMessageRow = ({ message, isSequential, isFirstUnread }: ThreadMessageRowProps) => {
	const { ignoredUser } = useMessageMarkers(message);

	if (MessageTypes.isSystemMessage(message)) {
		return <SystemMessage message={message} />;
	}

	return (
		<ThreadMessage
			message={message as IThreadMessage | IThreadMainMessage}
			sequential={isSequential}
			unread={isFirstUnread}
			ignoredUser={ignoredUser || !!(message as { ignored?: boolean }).ignored}
		/>
	);
};

export default memo(ThreadMessageRow);
