import { css } from '@rocket.chat/css-in-js';
import { IconButton, useStyle } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import type { MouseEvent, AllHTMLAttributes } from 'react';
import { memo } from 'react';

import { usePreviewEmoji } from '../../../contexts/EmojiPickerContext';
import type { EmojiItem } from '../../../lib/emoji';

export type EmojiElementProps = EmojiItem & { small?: boolean; onClick: (e: MouseEvent<HTMLElement>) => void } & Omit<
		AllHTMLAttributes<HTMLButtonElement>,
		'is' | 'color' | 'size'
	>;

const smallEmojiClass = css`
	--emoji-size: 1.25rem;
`;

const EmojiElement = ({ emoji, image, onClick, small = false, ...props }: EmojiElementProps) => {
	const { handlePreview, handleRemovePreview } = usePreviewEmoji();
	const smallEmojiClassName = useStyle(smallEmojiClass);

	if (!image) {
		return null;
	}

	const emojiElement = <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(image) }} />;

	return (
		<IconButton
			{...(small && { className: smallEmojiClassName })}
			size={small ? 'small' : 'medium'}
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
