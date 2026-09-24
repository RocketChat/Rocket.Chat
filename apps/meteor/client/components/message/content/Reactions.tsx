import { useToolbar } from '@react-aria/toolbar';
import type { IMessage } from '@rocket.chat/core-typings';
import { MessageReactions, MessageReactionAction } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, KeyboardEvent, MouseEvent } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { hasUserReacted } from '../helpers/messageViewerFacts';
import { useMessageActions } from '../list/MessageActionsContext';
import { useMessageListViewer } from '../list/MessageViewerContext';
import Reaction from './reactions/Reaction';

export type ReactionsProps = {
	message: IMessage;
} & HTMLAttributes<HTMLDivElement>;

const Reactions = ({ message, ...props }: ReactionsProps) => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const { uid, username } = useMessageListViewer();
	const actions = useMessageActions();
	const hasReacted = (reaction: string) => hasUserReacted(message, username, reaction);
	const openEmojiPicker = (e: MouseEvent | KeyboardEvent) => {
		if (!uid) {
			return;
		}
		e.nativeEvent.stopImmediatePropagation();
		actions.openReactionPicker(message, e.currentTarget);
	};
	const { toolbarProps } = useToolbar(props, ref);
	const buttonProps = useButtonPattern(openEmojiPicker);

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
						onClick={() => actions.toggleReaction(message, name)}
					/>
				))}
			<MessageReactionAction title={t('Add_Reaction')} {...buttonProps} />
		</MessageReactions>
	);
};

export default Reactions;
