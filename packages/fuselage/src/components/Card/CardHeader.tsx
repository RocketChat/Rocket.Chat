import { styled } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardBlock } from './CardFrames';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type CardHeaderProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardHeader = styled(CardBlock, {
	row: true,

	variants: {
		rcx: { true: variantClass('rcx-card__header') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<CardHeaderProps>(CardHeader);
