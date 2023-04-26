import { Box, IconButton } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import React from 'react';

import type { EmojiElementType } from './EmojiElementType';

type EmojiElementProps = EmojiElementType & { onClick: (e: MouseEvent<HTMLElement>) => void };

const EmojiElement = ({ emoji, image, onClick }: EmojiElementProps) => {
	if (!image) {
		return null;
	}

	const emojiElement = <Box dangerouslySetInnerHTML={{ __html: image }} />;

	return <IconButton onClick={onClick} data-emoji={emoji} title={emoji} icon={emojiElement} />;
};

export default EmojiElement;
