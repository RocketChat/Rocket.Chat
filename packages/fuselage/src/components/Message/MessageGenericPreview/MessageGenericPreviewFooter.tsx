import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { previewContextColor } from './MessageGenericPreview';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { size } from '../../../styleTokens';
import { plainDiv, textScale, truncatedText } from '../messageStyles';

const MessageGenericPreviewFooterFrame = styled(Text, {
	...plainDiv,
	...truncatedText,
	...textScale('c1'),
	width: size('full'),
	color: previewContextColor,

	variants: {
		rcx: { true: variantClass('rcx-message-generic-preview__footer') },
		// Accepted for compatibility; the footer never clamped
		clamp: { true: {}, false: {} },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageGenericPreviewFooterProps = {
	children?: ReactNode;
	clamp?: boolean;
};

export default asPublicFrame<MessageGenericPreviewFooterProps>(MessageGenericPreviewFooterFrame);
