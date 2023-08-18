import { css } from '@rocket.chat/css-in-js';
import { IconButton } from '@rocket.chat/fuselage';
import type { MouseEvent, AllHTMLAttributes } from 'react';
import React, { memo } from 'react';

import type { EmojiItem } from '../../../../app/emoji/client';
import { usePreviewEmoji } from '../../../contexts/EmojiPickerContext';

type EmojiElementProps = EmojiItem & { small?: boolean; onClick: (e: MouseEvent<HTMLElement>) => void } & Omit<
		AllHTMLAttributes<HTMLButtonElement>,
		'is'
	>;

const EmojiElement = ({ emoji, image, onClick, small = false, ...props }: EmojiElementProps) => {
	const { handlePreview, handleRemovePreview } = usePreviewEmoji();

	if (!image) {
		return null;
	}

	const emojiSmallClass = css`
		> .emoji,
		.emojione {
			width: 1.125rem;
			height: 1.125rem;
		}
	`;

	const emojiElement = <div dangerouslySetInnerHTML={{ __html: image }} />;

	return (
		<IconButton
			{...props}
			{...(small && { className: emojiSmallClass })}
			small={small}
			medium={!small}
			onMouseOver={() => handlePreview(image, emoji)}
			onMouseLeave={handleRemovePreview}
			onClick={onClick}
			data-emoji={emoji}
			aria-label={emoji}
			icon={emojiElement}
		/>
	);
};

export default memo(EmojiElement);
