import { useToolbar } from '@react-aria/toolbar';
import type { IMessage } from '@rocket.chat/core-typings';
import { MessageReactions, MessageReactionAction } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUser } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, UIEvent } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Reaction from './reactions/Reaction';
import { useMessageInteractions } from '../contexts/MessageInteractionsContext';

export type ReactionsProps = {
	message: IMessage;
} & HTMLAttributes<HTMLDivElement>;

const Reactions = ({ message, ...props }: ReactionsProps) => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const username = useUser()?.username;
	const { toggleReaction, hasReacted, openReactionPicker } = useMessageInteractions();
	const { toolbarProps } = useToolbar(props, ref);
	const buttonProps = useButtonPattern((event: UIEvent) => {
		event.nativeEvent.stopImmediatePropagation();
		openReactionPicker(event, message);
	});

	return (
		<MessageReactions ref={ref} {...toolbarProps} {...props}>
			{message.reactions &&
				Object.entries(message.reactions).map(([name, reactions]) => (
					<Reaction
						key={name}
						counter={reactions.usernames.length}
						hasReacted={(reaction) => hasReacted(message, reaction)}
						name={name}
						names={reactions.usernames.filter((user) => user !== username).map((username) => `@${username}`)}
						messageId={message._id}
						onClick={() => toggleReaction(message, name)}
					/>
				))}
			<MessageReactionAction title={t('Add_Reaction')} {...buttonProps} />
		</MessageReactions>
	);
};

export default Reactions;
