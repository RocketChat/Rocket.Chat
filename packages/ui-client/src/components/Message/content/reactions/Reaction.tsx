import { MessageReaction as MessageReactionTemplate, MessageReactionEmoji, MessageReactionCounter } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useTooltipClose, useTooltipOpen, useUser } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ReactionTooltip from './ReactionTooltip';
import { useMessageContent } from '../../contexts/MessageContentContext';
import { useMessageDisplay } from '../../contexts/MessageDisplayContext';
import { normalizeUsername } from '../../lib/normalizeUsername';

const normalizeUsernames = (names: string[]) => names.map<string>(normalizeUsername);

export type ReactionProps = {
	hasReacted: (name: string) => boolean;
	counter: number;
	name: string;
	names: string[];
	messageId: string;
	onClick: () => void;
} & ComponentProps<typeof MessageReactionTemplate>;

const Reaction = ({ hasReacted, counter, name, names, messageId, onClick, ...props }: ReactionProps) => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();
	const { showRealName } = useMessageDisplay();
	const username = useUser()?.username;
	const { getEmojiData } = useMessageContent();

	const mine = hasReacted(name);

	const { name: emojiName, className, image, content } = getEmojiData(name);
	const buttonProps = useButtonPattern(onClick);

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

				if (!ref.current) {
					return;
				}

				openTooltip(
					<ReactionTooltip
						emojiName={name}
						usernames={normalizeUsernames(names)}
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
			{...buttonProps}
			{...props}
		>
			<MessageReactionEmoji name={emojiName} className={className} image={image}>
				{content}
			</MessageReactionEmoji>
			<MessageReactionCounter counter={counter} />
		</MessageReactionTemplate>
	);
};

export default Reaction;
