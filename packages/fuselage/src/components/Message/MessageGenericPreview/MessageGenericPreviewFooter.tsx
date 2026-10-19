import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { previewContextColor } from './MessageGenericPreview';
import { size } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv, textScale, truncatedText } from '../messageStyles';

const MessageGenericPreviewFooterFrame = styled(Text, {
	...plainDiv,
	...truncatedText,
	...textScale('c1'),
	width: size('full'),
	color: previewContextColor,
});

export type MessageGenericPreviewFooterProps = {
	children?: ReactNode;
	clamp?: boolean;
};

const MessageGenericPreviewFooter = ({ children }: MessageGenericPreviewFooterProps) => (
	<MessageGenericPreviewFooterFrame className='rcx-message-generic-preview__footer'>{children}</MessageGenericPreviewFooterFrame>
);

export default withFuselageProvider(MessageGenericPreviewFooter);
