import type { IMessage } from '@rocket.chat/core-typings';
import { MessageReactions, MessageReactionAction } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import {
	useOpenEmojiPicker,
	useReactionsFilter,
	useReactToMessage,
	useUserHasReacted,
} from '../../../views/room/MessageList/contexts/MessageListContext';
import Reaction from './reactions/Reaction';

type ReactionsProps = {
	message: IMessage;
};

const Reactions = ({ message }: ReactionsProps): ReactElement => {
	const hasReacted = useUserHasReacted(message);
	const reactToMessage = useReactToMessage(message);
	const filterReactions = useReactionsFilter(message);
	const openEmojiPicker = useOpenEmojiPicker(message);

	return (
		<MessageReactions>
			{message.reactions &&
				Object.entries(message.reactions).map(([name, reactions]) => (
					<Reaction
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

export default Reactions;
