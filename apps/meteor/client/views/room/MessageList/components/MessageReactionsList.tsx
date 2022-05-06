import { IMessage } from '@rocket.chat/core-typings';
import { MessageReactions, MessageReactionAction } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useOpenEmojiPicker, useReactionsFilter, useReactToMessage, useUserHasReacted } from '../contexts/MessageListContext';
import { MessageReaction } from './MessageReaction';

const MessageReactionsList = ({ message }: { message: IMessage }): ReactElement | null => {
	const hasReacted = useUserHasReacted(message);
	const reactToMessage = useReactToMessage(message);
	const filterReactions = useReactionsFilter(message);
	const openEmojiPicker = useOpenEmojiPicker(message);

	return (
		<MessageReactions>
			{message.reactions &&
				Object.entries(message.reactions).map(([name, reactions]) => (
					<MessageReaction
						key={name}
						counter={reactions.usernames.length}
						hasReacted={hasReacted}
						reactToMessage={reactToMessage}
						name={name}
						names={filterReactions(name)}
					/>
				))}
			<MessageReactionAction onClick={openEmojiPicker} />
		</MessageReactions>
	);
};

export default MessageReactionsList;
