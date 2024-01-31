import { MessageReaction as MessageReactionTemplate, MessageReactionEmoji, MessageReactionCounter } from '@rocket.chat/fuselage';
import { useTooltipClose, useTooltipOpen } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef, useContext } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';
import { MessageListContext } from '../../list/MessageListContext';
import ReactionTooltip from './ReactionTooltip';

// TODO: replace it with proper usage of i18next plurals
type ReactionProps = {
	hasReacted: (name: string) => boolean;
	counter: number;
	name: string;
	names: string[];
	messageId: string;
	onClick: () => void;
};

const Reaction = ({ hasReacted, counter, name, names, messageId, ...props }: ReactionProps): ReactElement => {
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
			tabIndex={0}
			role='button'
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
