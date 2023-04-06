import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import React from 'react';

export type EmojiElementType = {
	emoji: string;
	image: string;
};

type EmojiElementProps = EmojiElementType & { onClick: (e: MouseEvent) => void };

const EmojiElement = ({ emoji, image, onClick }: EmojiElementProps) => {
	const emojiStyle = css`
		display: inline-block;
		margin: 2px;
		padding: 4px;
		cursor: pointer;
		-webkit-transition: -webkit-transform 0.2s ease;
		transition: -webkit-transform 0.2s ease;
		transition: transform 0.2s ease;
		transition: transform 0.2s ease, -webkit-transform 0.2s ease;
		border-radius: 4px;
		&:hover {
			-webkit-transform: scale(1.2);
			transform: scale(1.2);
			background-color: #dddddd;
		}
	`;

	if (!image) {
		return null;
	}

	return (
		// <Box
		// 	is='li'
		// 	onClick={onClick}
		// 	dangerouslySetInnerHTML={{ __html: image }}
		// 	className={[`emoji-${emoji}`, 'emoji-picker-item', emojiStyle].filter(Boolean)}
		// 	data-emoji={emoji}
		// 	title={emoji}
		// />
		<IconButton onClick={onClick} data-emoji={emoji} title={emoji} icon={undefined}>
			<Box dangerouslySetInnerHTML={{ __html: image }} />
		</IconButton>
	);
};

export default EmojiElement;
