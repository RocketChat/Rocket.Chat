import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { KeyboardEventHandler, Ref, RefCallback } from 'react';
import { useCallback, useState } from 'react';

import { useMergedRefsV2 } from '../../../hooks/useMergedRefsV2';
import type { EmojiItem } from '../../../lib/emoji';
import EmojiElement from '../../../views/composer/EmojiPicker/EmojiElement';

const toolbarBorderRadius = 'var(--rcx-message-toolbar-border-radius, var(--rcx-border-radius-medium, 0.25rem))';

// A second line hanging from the toolbar, edge to edge with its border
const lineClassName = css`
	position: absolute;
	inset-block-start: 100%;
	inset-inline: -1px;
	display: flex;
	gap: 0.25rem;
	padding: 0.125rem;
	border: 1px solid ${Palette.stroke['stroke-extra-light']};
	border-end-start-radius: ${toolbarBorderRadius};
	border-end-end-radius: ${toolbarBorderRadius};
	background: ${Palette.surface['surface-room']};

	.rcx-message-toolbar:has(&) {
		border-end-start-radius: 0;
		border-end-end-radius: 0;
	}
`;

const toPixels = (length: string) => parseFloat(length) || 0;

/** How many items as wide as the element's previous sibling fit on one line of the element. */
const useSiblingSlots = (): [RefCallback<HTMLElement>, number] => {
	const [slots, setSlots] = useState(0);

	const ref = useCallback((node: HTMLElement) => {
		const measure = () => {
			const slotWidth = node.previousElementSibling?.getBoundingClientRect().width;
			if (!slotWidth) {
				setSlots(0);
				return;
			}

			const style = getComputedStyle(node);
			const gap = toPixels(style.columnGap);
			const contentWidth = node.clientWidth - toPixels(style.paddingInlineStart) - toPixels(style.paddingInlineEnd);
			setSlots(Math.max(0, Math.floor((contentWidth + gap) / (slotWidth + gap))));
		};

		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(node);

		return () => observer.disconnect();
	}, []);

	return [ref, slots];
};

export type MessageToolbarMoreQuickReactionsProps = {
	reactions: EmojiItem[];
	onReact: (emoji: string) => void;
	onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
	ref: Ref<HTMLDivElement>;
};

/**
 * A line below the message toolbar, as wide as it, with as many `reactions` as fit. It must be rendered right after
 * a quick reaction, whose width sets the size of each slot.
 */
const MessageToolbarMoreQuickReactions = ({ reactions, onReact, onKeyDown, ref }: MessageToolbarMoreQuickReactionsProps) => {
	const [slotsRef, slots] = useSiblingSlots();
	const mergedRef = useMergedRefsV2<HTMLDivElement>(slotsRef, ref);

	return (
		<Box ref={mergedRef} className={lineClassName}>
			{reactions.slice(0, slots).map(({ emoji, image }) => (
				<EmojiElement key={emoji} small title={emoji} emoji={emoji} image={image} onClick={() => onReact(emoji)} onKeyDown={onKeyDown} />
			))}
		</Box>
	);
};

export default MessageToolbarMoreQuickReactions;
