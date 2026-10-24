import { styled, Text, type GetProps } from '@tamagui/web';
import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';

import { previewTitleColor } from './MessageGenericPreview';
import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { textScale, truncatedText } from '../messageStyles';

const MessageGenericPreviewTitleFrame = styled(Text, {
	render: 'span',
	display: 'block',
	wordWrap: 'inherit',
	...truncatedText,
	...textScale('p2'),
	marginBlockEnd: spacing('x4'),
	color: previewTitleColor,
});

export type MessageGenericPreviewTitleProps = {
	externalUrl?: string;
} & HTMLAttributes<HTMLSpanElement> &
	AnchorHTMLAttributes<HTMLAnchorElement>;

const MessageGenericPreviewTitle = ({ externalUrl, children, ...props }: MessageGenericPreviewTitleProps) => {
	if (externalUrl) {
		return (
			<MessageGenericPreviewTitleFrame
				render='a'
				className='rcx-message-generic-preview__title rcx-message-generic-preview__title-link'
				{...({ href: externalUrl, target: '_blank', ...props } as GetProps<typeof MessageGenericPreviewTitleFrame>)}
			>
				{children}
			</MessageGenericPreviewTitleFrame>
		);
	}

	return (
		<MessageGenericPreviewTitleFrame
			className='rcx-message-generic-preview__title'
			{...(props as GetProps<typeof MessageGenericPreviewTitleFrame>)}
		/>
	);
};

export default withFuselageProvider(MessageGenericPreviewTitle);
