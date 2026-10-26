import type { AllHTMLAttributes, ReactNode } from 'react';

import { Box } from '../Box';

export type CardGroupProps = {
	align?: 'start' | 'center' | 'end';
	stretch?: boolean;
	wrap?: boolean;
	vertical?: boolean;
	children?: ReactNode;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'wrap'>;

const CardGroup = ({ align = 'start', stretch, vertical, wrap, ...props }: CardGroupProps) => (
	<Box
		rcx-card-group
		rcx-card-group--align={align}
		rcx-card-group--stretch={stretch}
		rcx-card-group--vertical={vertical}
		rcx-card-group--wrap={wrap}
		role='group'
		{...props}
	/>
);

export default CardGroup;
