import { Box } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerPreview = ({ emoji, name, ...props }: { emoji: string; name: string } & Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>) => {
	const previewEmojiClass = css`
		span {
			width: 40px;
			height: 40px;
		}
	`;

	return (
		<Box {...props} display='flex' alignItems='center'>
			<Box className={previewEmojiClass} dangerouslySetInnerHTML={{ __html: emoji }}></Box>
			<Box mis='x4' display='flex' flexDirection='column'>
				<Box fontScale='c2'>{name}</Box>
				<Box fontScale='c1'>{`:${name}:`}</Box>
			</Box>
		</Box>
	);
};

export default EmojiPickerPreview;
