import { styled, Text } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontScale, spacing } from '../../styleTokens';

export type StatesSubtitleProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

/** The centered column shared by the subtitle, the suggestion and the suggestion list. */
export const StatesBlockFrame = styled(Text, {
	render: 'div',
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	boxSizing: 'content-box',
	width: '100%',
	maxWidth: 462,
	marginBlockStart: 0,
	marginBlockEnd: spacing('x24'),
	marginInline: 0,
	padding: 0,
	textAlign: 'center',
	...(fontScale('p2m') as object),
});

const StatesSubtitleFrame = styled(StatesBlockFrame, {
	...(fontScale('p1') as object),

	variants: {
		rcx: { true: variantClass('rcx-states__subtitle') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<StatesSubtitleProps>(StatesSubtitleFrame);
