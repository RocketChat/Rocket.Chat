import { Box, IconButton } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import React from 'react';

import type { EmojiElementType } from './EmojiElementType';

type EmojiElementProps = EmojiElementType & { onClick: (e: MouseEvent<HTMLElement>) => void };

// TODO: adapt IconButton with fuselage
const EmojiElement = ({ emoji, image, onClick }: EmojiElementProps) => {
	if (!image) {
		return null;
	}

	return (
		<IconButton onClick={onClick} data-emoji={emoji} title={emoji} icon={undefined}>
			<Box dangerouslySetInnerHTML={{ __html: image }} />
		</IconButton>
	);
};

export default EmojiElement;
