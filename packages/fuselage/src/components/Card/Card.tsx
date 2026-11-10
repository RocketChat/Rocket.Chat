import type { AllHTMLAttributes } from 'react';

import { Box } from '../Box';

export type CardProps = {
	horizontal?: boolean;
	hero?: boolean;
	clickable?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const Card = ({ horizontal, hero, clickable, ...props }: CardProps) => (
	<Box
		rcx-card
		rcx-card__horizontal={horizontal}
		rcx-card__vertical={!horizontal}
		rcx-card__hero={hero}
		rcx-card__clickable={clickable}
		{...props}
	/>
);

export default Card;
