import { MessageReaction as MessageReactionTemplate, MessageReactionEmoji, MessageReactionCounter } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTooltipClose, useTooltipOpen, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';
import MarkdownText from '../../../MarkdownText';

const getTranslationKey = (users: string[], mine: boolean): TranslationKey => {
	if (users.length === 0) {
		if (mine) {
			return 'You_reacted_with';
		}
	}

	if (users.length > 15) {
		if (mine) {
			return 'You_users_and_more_Reacted_with';
		}
		return 'Users_and_more_reacted_with';
	}

	if (mine) {
		return 'You_and_users_Reacted_with';
	}
	return 'Users_reacted_with';
};

type ReactionProps = {
	hasReacted: (name: string) => boolean;
	reactToMessage: (name: string) => void;
	counter: number;
	name: string;
	names: string[];
};

const Reaction = ({ hasReacted, reactToMessage, counter, name, names, ...props }: ReactionProps): ReactElement => {
	const t = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();

	const mine = hasReacted(name);

	const key = getTranslationKey(names, mine);

	const emojiProps = getEmojiClassNameAndDataTitle(name);
	return (
		<MessageReactionTemplate
			ref={ref}
			key={name}
			mine={mine}
			onClick={(): void => reactToMessage(name)}
			tabIndex={0}
			role='button'
			onMouseOver={(e): void => {
				e.stopPropagation();
				e.preventDefault();
				ref.current &&
					openTooltip(
						<MarkdownText
							content={t(key, {
								counter: names.length,
								users: names.join(', '),
								emoji: name,
							})}
							variant='inline'
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
