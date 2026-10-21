import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { size } from '../../../styleTokens';
import { plainDiv } from '../messageStyles';

const MessageGenericPreviewThumbFrame = styled(Text, {
	...plainDiv,
	width: size('x96'),
	height: size('x96'),
	flexShrink: 0,

	variants: {
		rcx: { true: variantClass('rcx-message-generic-preview__thumb') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageGenericPreviewThumbProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<MessageGenericPreviewThumbProps>(MessageGenericPreviewThumbFrame);
