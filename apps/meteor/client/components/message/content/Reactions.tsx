import type { IMessage } from '@rocket.chat/core-typings';
import { MessageReactions, MessageReactionAction } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useOpenEmojiPicker, useReactionsFilter, useUserHasReacted } from '../list/MessageListContext';
import Reaction from './reactions/Reaction';
import { useToggleReactionMutation } from './reactions/useToggleReactionMutation';

type ReactionsProps = {
	message: IMessage;
};

const Reactions = ({ message }: ReactionsProps): ReactElement | null => {
	const hasReacted = useUserHasReacted(message);
	const filterReactions = useReactionsFilter(message);
	const openEmojiPicker = useOpenEmojiPicker(message);
	const useEmoji = useUserPreference('useEmoji');

	const toggleReactionMutation = useToggleReactionMutation();

	if (!useEmoji) {
		return null;
	}

	return (
		<MessageReactions>
			{message.reactions &&
				Object.entries(message.reactions).map(([name, reactions]) => (
					<Reaction
						key={name}
						counter={reactions.usernames.length}
						hasReacted={hasReacted}
						name={name}
						names={filterReactions(name)}
						onClick={() => toggleReactionMutation.mutate({ mid: message._id, reaction: name })}
					/>
				))}
			<MessageReactionAction onClick={openEmojiPicker} />
		</MessageReactions>
	);
};

export default Reactions;
