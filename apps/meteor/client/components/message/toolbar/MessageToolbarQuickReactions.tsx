import { Box } from '@rocket.chat/fuselage';
import type { FocusEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import MessageToolbarMoreQuickReactions from './MessageToolbarMoreQuickReactions';
import type { EmojiItem } from '../../../lib/emoji';
import EmojiElement from '../../../views/composer/EmojiPicker/EmojiElement';

const VISIBLE_REACTIONS = 5;
const HOVER_INTENT_DELAY = 150;

export type MessageToolbarQuickReactionsProps = {
	reactions: EmojiItem[];
	onReact: (emoji: string) => void;
};

/**
 * The first few `reactions`, one click away. Hovering them, or reaching them with the keyboard, opens a line below
 * the toolbar with as many of the remaining ones as fit its width; Escape closes it.
 */
const MessageToolbarQuickReactions = ({ reactions, onReact }: MessageToolbarQuickReactionsProps) => {
	const [expanded, setExpanded] = useState(false);
	const intentTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
	const groupRef = useRef<HTMLDivElement>(null);
	const moreReactionsRef = useRef<HTMLDivElement>(null);

	useEffect(() => () => clearTimeout(intentTimeout.current), []);

	const expandNow = (value: boolean) => {
		clearTimeout(intentTimeout.current);
		setExpanded(value);
	};

	const expandSoon = (value: boolean) => {
		clearTimeout(intentTimeout.current);
		intentTimeout.current = setTimeout(() => setExpanded(value), HOVER_INTENT_DELAY);
	};

	const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
		if (event.target.matches(':focus-visible')) {
			expandNow(true);
		}
	};

	const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
		if (!event.currentTarget.contains(event.relatedTarget)) {
			expandNow(false);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key !== 'Escape' || !expanded) {
			return;
		}

		event.stopPropagation();

		if (moreReactionsRef.current?.contains(event.currentTarget)) {
			groupRef.current?.querySelector('button')?.focus();
		}

		expandNow(false);
	};

	const visibleReactions = reactions.slice(0, VISIBLE_REACTIONS);
	const moreReactions = reactions.slice(VISIBLE_REACTIONS);

	return (
		<Box
			ref={groupRef}
			display='contents'
			onMouseEnter={() => expandSoon(true)}
			onMouseLeave={() => expandSoon(false)}
			onFocus={handleFocus}
			onBlur={handleBlur}
		>
			{visibleReactions.map(({ emoji, image }) => (
				<EmojiElement
					key={emoji}
					small
					title={emoji}
					emoji={emoji}
					image={image}
					onClick={() => onReact(emoji)}
					onKeyDown={handleKeyDown}
				/>
			))}
			{expanded && moreReactions.length > 0 && (
				<MessageToolbarMoreQuickReactions ref={moreReactionsRef} reactions={moreReactions} onReact={onReact} onKeyDown={handleKeyDown} />
			)}
		</Box>
	);
};

export default MessageToolbarQuickReactions;
