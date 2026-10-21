import { styled } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { CardBlock } from './CardFrames';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type CardControlsProps = HTMLAttributes<HTMLDivElement>;

const CardControls = styled(CardBlock, {
	row: true,

	variants: {
		rcx: { true: variantClass('rcx-card__controls') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<CardControlsProps>(CardControls);
