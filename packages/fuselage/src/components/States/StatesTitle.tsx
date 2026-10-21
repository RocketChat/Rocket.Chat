import { styled, Text } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontScale, spacing } from '../../styleTokens';

export type StatesTitleProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLHeadingElement>;

const StatesTitleFrame = styled(Text, {
	render: 'h3',
	display: 'block',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	boxSizing: 'content-box',
	marginBlockStart: 0,
	marginBlockEnd: spacing('x8'),
	textAlign: 'center',
	color: String(textIconColors['font-default']),
	...(fontScale('h3') as object),

	variants: {
		rcx: { true: variantClass('rcx-states__title') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<StatesTitleProps>(StatesTitleFrame);
