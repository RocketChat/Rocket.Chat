import { useToolbar } from '@react-aria/toolbar';
import type { IMessage } from '@rocket.chat/core-typings';
import { MessageReactions, MessageReactionAction } from '@rocket.chat/fuselage';
import type { HTMLAttributes, KeyboardEvent, ReactElement } from 'react';
import { useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageListContext, useOpenEmojiPicker, useUserHasReacted } from '../list/MessageListContext';
import Reaction from './reactions/Reaction';
import { useToggleReactionMutation } from './reactions/useToggleReactionMutation';

type ReactionsProps = {
	message: IMessage;
} & HTMLAttributes<HTMLDivElement>;

const Reactions = ({ message, ...props }: ReactionsProps): ReactElement => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const hasReacted = useUserHasReacted(message);
	const openEmojiPicker = useOpenEmojiPicker(message);
	const { username } = useContext(MessageListContext);
	const toggleReactionMutation = useToggleReactionMutation();
	const { toolbarProps } = useToolbar(props, ref);

	return (
		<MessageReactions ref={ref} {...toolbarProps} {...props}>
			{message.reactions &&
				Object.entries(message.reactions).map(([name, reactions]) => (
					<Reaction
						key={name}
						counter={reactions.usernames.length}
						hasReacted={hasReacted}
						name={name}
						names={reactions.usernames.filter((user) => user !== username).map((username) => `@${username}`)}
						messageId={message._id}
						onKeyDown={(e: KeyboardEvent) =>
							(e.code === 'Space' || e.code === 'Enter') && toggleReactionMutation.mutate({ mid: message._id, reaction: name })
						}
						onClick={() => toggleReactionMutation.mutate({ mid: message._id, reaction: name })}
					/>
				))}
			<MessageReactionAction
				title={t('Add_Reaction')}
				onKeyDown={(e: KeyboardEvent) => (e.code === 'Space' || e.code === 'Enter') && openEmojiPicker(e)}
				onClick={openEmojiPicker}
			/>
		</MessageReactions>
	);
};

export default Reactions;
