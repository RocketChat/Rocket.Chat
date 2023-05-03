import { Box, IconButton } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import React from 'react';

import type { EmojiItem } from '../../../../app/emoji/client';
import { usePreviewEmoji } from '../../../contexts/EmojiPickerContext';

type EmojiElementProps = EmojiItem & { onClick: (e: MouseEvent<HTMLElement>) => void };

const EmojiElement = ({ emoji, image, onClick }: EmojiElementProps) => {
	const { handlePreview, handleUnpreview } = usePreviewEmoji();
	if (!image) {
		return null;
	}

	const emojiElement = <Box dangerouslySetInnerHTML={{ __html: image }} />;

	return (
		<IconButton
			medium
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
