import { styled, View } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { spacing } from '../../styleTokens';

export type StatesProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesFrame = styled(View, {
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	boxSizing: 'content-box',
	padding: spacing('x16'),
	color: String(textIconColors['font-secondary-info']),

	variants: {
		rcx: { true: variantClass('rcx-states') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<StatesProps>(StatesFrame);
