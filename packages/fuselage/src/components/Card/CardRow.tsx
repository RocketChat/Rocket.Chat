import { styled } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardBlock } from './CardFrames';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type CardRowProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardRow = styled(CardBlock, {
	row: true,
	flexGrow: 1,

	variants: {
		rcx: { true: variantClass('rcx-card__row') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<CardRowProps>(CardRow);
