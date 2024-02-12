import type { IMessage } from '@rocket.chat/core-typings';
import { MessageReactions, MessageReactionAction } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useContext } from 'react';

import { MessageListContext, useOpenEmojiPicker, useUserHasReacted } from '../list/MessageListContext';
import Reaction from './reactions/Reaction';
import { useToggleReactionMutation } from './reactions/useToggleReactionMutation';

type ReactionsProps = {
	message: IMessage;
};

const Reactions = ({ message }: ReactionsProps): ReactElement => {
	const hasReacted = useUserHasReacted(message);
	const openEmojiPicker = useOpenEmojiPicker(message);
	const { username } = useContext(MessageListContext);
	const toggleReactionMutation = useToggleReactionMutation();

	return (
		<MessageReactions>
			{message.reactions &&
				Object.entries(message.reactions).map(([name, reactions]) => (
					<Reaction
						key={name}
						counter={reactions.usernames.length}
						hasReacted={hasReacted}
						name={name}
						names={reactions.usernames.filter((user) => user !== username).map((username) => `@${username}`)}
						messageId={message._id}
						onClick={() => toggleReactionMutation.mutate({ mid: message._id, reaction: name })}
					/>
				))}
			<MessageReactionAction onClick={openEmojiPicker} />
		</MessageReactions>
	);
};

export default Reactions;
