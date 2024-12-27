import { MessageReaction as MessageReactionTemplate, MessageReactionEmoji, MessageReactionCounter } from '@rocket.chat/fuselage';
import { useTooltipClose, useTooltipOpen } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import ReactionTooltip from './ReactionTooltip';
import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';
import { MessageListContext } from '../../list/MessageListContext';

// TODO: replace it with proper usage of i18next plurals
type ReactionProps = {
	hasReacted: (name: string) => boolean;
	counter: number;
	name: string;
	names: string[];
	messageId: string;
} & ComponentProps<typeof MessageReactionTemplate>;

const Reaction = ({ hasReacted, counter, name, names, messageId, ...props }: ReactionProps): ReactElement => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();
	const { showRealName, username } = useContext(MessageListContext);

	const mine = hasReacted(name);

	const emojiProps = getEmojiClassNameAndDataTitle(name);

	return (
		<MessageReactionTemplate
			ref={ref}
			key={name}
			mine={mine}
			aria-label={t('React_with__reaction__', { reaction: name })}
			// if data-tooltip is not set, the tooltip will close on first mouse enter
			data-tooltip=''
			onMouseEnter={async (e) => {
				e.stopPropagation();
				e.preventDefault();

				ref.current &&
					openTooltip(
						<ReactionTooltip
							emojiName={name}
							usernames={names}
							mine={mine}
							messageId={messageId}
							showRealName={showRealName}
							username={username}
						/>,
						ref.current,
					);
			}}
			onMouseLeave={(): void => {
				closeTooltip();
			}}
			{...props}
		>
			<MessageReactionEmoji {...emojiProps} />
			<MessageReactionCounter counter={counter} />
		</MessageReactionTemplate>
	);
};

export default Reaction;
