import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import type { MouseEvent, AllHTMLAttributes } from 'react';
import React from 'react';

import type { EmojiItem } from '../../../../app/emoji/client';
import { usePreviewEmoji } from '../../../contexts/EmojiPickerContext';

type EmojiElementProps = EmojiItem & { onClick: (e: MouseEvent<HTMLElement>) => void } & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const EmojiElement = ({ emoji, image, onClick, ...props }: EmojiElementProps) => {
	const { handlePreview, handleUnpreview, isScrolling } = usePreviewEmoji();
	if (!image) {
		return null;
	}

	const emojiElement = <Box dangerouslySetInnerHTML={{ __html: image }} />;

	const iconButtonClass = css`
		${isScrolling &&
		`
		pointer-events: none;
		
		`}
	`;

	return (
		<IconButton
			{...props}
			medium
			className={iconButtonClass}
			onMouseOver={() => handlePreview(image, emoji)}
			onMouseLeave={handleUnpreview}
			onClick={onClick}
			data-emoji={emoji}
			aria-label={emoji}
			icon={emojiElement}
		/>
	);
};

export default EmojiElement;
