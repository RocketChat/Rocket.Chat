import type { AllHTMLAttributes, ReactNode } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import { Box } from '../Box';

export type CardGroupProps = {
	/** Where the cards sit along the row, or along the column when `vertical`. */
	align?: 'start' | 'center' | 'end';
	/** Grows the cards to fill the group, with equal heights in a row and the full width in a column. */
	stretch?: boolean;
	/** Lets the cards wrap onto more rows instead of overflowing. */
	wrap?: boolean;
	vertical?: boolean;
	children?: ReactNode;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'wrap'>;

/** Lines up cards in a row, 16px apart, or in a `vertical` column, 8px apart. */
const CardGroup = ({ align = 'start', children, stretch, vertical, wrap, ...props }: CardGroupProps) => (
	<Box
		rcx-card-group
		rcx-card-group--align={align}
		rcx-card-group--stretch={stretch}
		rcx-card-group--vertical={vertical}
		rcx-card-group--wrap={wrap}
		role='group'
		{...props}
	>
		{patchChildren(children, (childProps: { className: string | string[] }) => ({
			className: appendClassName(childProps.className, 'rcx-card-group__item'),
		}))}
	</Box>
);

export default CardGroup;
