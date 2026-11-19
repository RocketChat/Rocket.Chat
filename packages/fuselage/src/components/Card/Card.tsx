import type { AllHTMLAttributes } from 'react';

import { Box } from '../Box';

export type CardProps = {
	/** Lays the content out in a row instead of a column, wrapping it on small screens. */
	horizontal?: boolean;
	/** Adds padding, for priority information at the top of a page. */
	hero?: boolean;
	/** Highlights the card on hover and focus. It adds no click handling or keyboard focus of its own. */
	clickable?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

/** Groups the content and actions about a single subject into one panel. */
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
