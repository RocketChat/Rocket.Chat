import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { memo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';

type MessageBoxPreviewProps = {
	text: string;
};

const MessageBoxPreview = ({ text }: MessageBoxPreviewProps): ReactElement | null => {
	const previewStyles = css`
		.rcx-attachment__details {
			.rcx-message-body {
				color: ${Palette.text['font-hint']};
			}
		}
		&:hover,
		&:focus {
			.rcx-attachment__details {
				background: ${Palette.surface['surface-hover']};
				border-color: ${Palette.stroke['stroke-light']};
				border-inline-start-color: ${Palette.stroke['stroke-medium']};
			}
		}
	`;

	return (
		<Box mbe={8} position='relative' overflowY='auto' maxHeight='x256' minHeight='10px' width='100%' className={previewStyles}>
			<Box
				display='flex'
				position='relative'
				className={css`
					font-size: 1rem;
					font-weight: 500;
					color: ${Palette.text['font-default']};
					border: 0.5px solid ${Palette.stroke['stroke-light']};
				`}
			>
				<MarkdownText variant='inline' content={text} parseEmoji />
			</Box>
		</Box>
	);
};

export default memo(MessageBoxPreview);
