import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { variantClass } from '../../../helpers/variantClass';
import { spacing } from '../../../styleTokens';
import { lineClamp, plainDiv, textScale, truncatedText } from '../messageStyles';

const MessageGenericPreviewDescriptionFrame = styled(Text, {
	...plainDiv,
	...textScale('c1'),
	marginBlockEnd: spacing('x4'),
	whiteSpace: 'normal',
	color: toCSSValue('--rcx-message-generic-preview-description-color', textIconColors['font-default']),

	variants: {
		rcx: { true: variantClass('rcx-message-generic-preview__description') },
		clamp: {
			true: variantClass('rcx-message-generic-preview__description--clamp', lineClamp(2)),
			false: truncatedText,
		},
	} as const,

	defaultVariants: { rcx: true, clamp: false },
});

export type MessageGenericPreviewDescriptionProps = {
	children?: ReactNode;
	clamp?: boolean;
};

export default asPublicFrame<MessageGenericPreviewDescriptionProps>(MessageGenericPreviewDescriptionFrame);
