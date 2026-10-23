import { css } from '@rocket.chat/css-in-js';
import { IconButton } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import type { MouseEvent, AllHTMLAttributes } from 'react';
import { memo, useMemo } from 'react';

import { usePreviewEmoji } from '../../../contexts/EmojiPickerContext';
import type { EmojiItem } from '../../../lib/emoji';

export type EmojiElementProps = EmojiItem & { small?: boolean; onClick: (e: MouseEvent<HTMLElement>) => void } & Omit<
		AllHTMLAttributes<HTMLButtonElement>,
		'is'
	>;

const smallEmojiClass = css`
	.emoji {
		font-size: 1.125rem;
	}
`;

const EmojiElement = ({ emoji, image, onClick, small = false, ...props }: EmojiElementProps) => {
	const { handlePreview, handleRemovePreview } = usePreviewEmoji();
	// Preserve the tooltip anchor across preview updates.
	const html = useMemo(() => ({ __html: DOMPurify.sanitize(image) }), [image]);

	if (!image) {
		return null;
	}

	const emojiElement = <div dangerouslySetInnerHTML={html} />;

	return (
		<IconButton
			{...(small && { className: smallEmojiClass })}
			small={small}
			medium={!small}
			onMouseEnter={() => handlePreview(image, emoji)}
			onMouseLeave={handleRemovePreview}
			onClick={onClick}
			data-emoji={emoji}
			aria-label={emoji}
			icon={emojiElement}
			{...props}
		/>
	);
};

export default memo(EmojiElement);
