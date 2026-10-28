import { styled } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardBlock } from './CardFrames';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type CardColProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardCol = styled(CardBlock, {
	variants: {
		rcx: { true: variantClass('rcx-card__col') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<CardColProps>(CardCol);
