import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { size, spacing } from '../../../styleTokens';
import { boxText, truncatedText } from '../messageStyles';

const MessageSystemContainerFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexShrink: 1,
	alignSelf: 'center',
	width: size('full'),
	marginBlock: spacing('neg-x4'),

	variants: {
		rcx: { true: variantClass('rcx-message-system__container') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageSystemContainerProps = {
	children?: ReactNode;
};

export default asPublicFrame<MessageSystemContainerProps>(MessageSystemContainerFrame);
