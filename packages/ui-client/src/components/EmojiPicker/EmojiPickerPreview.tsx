import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
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
			<Box className={previewEmojiClass} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(emoji) }}></Box>
			<Box mis={4} display='flex' flexDirection='column' maxWidth='x160'>
				<Box fontScale='c2' withTruncatedText>
					{name}
				</Box>
				<Box fontScale='c1' withTruncatedText>{`:${name}:`}</Box>
			</Box>
		</Box>
	);
};

export default EmojiPickerPreview;
