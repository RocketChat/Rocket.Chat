import type { CSSProperties, ReactNode } from 'react';
import { Children, isValidElement } from 'react';

import CardGridItem from './CardGridItem';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import type { GridItemProps } from '../Grid';
import { GridItem } from '../Grid';

export type CardGridProps = Omit<ElementProps<HTMLDivElement>, 'children'> & {
	children: ReactNode;
	/**
	 * Columns each card spans at each breakpoint, out of 4 at `xs`, 8 at `sm` and `md`, and 12 at `lg` and `xl`. A card
	 * in a `CardGridItem` takes its spans from there instead. Without it, the cards share a single row.
	 */
	breakpoints?: GridItemProps;
	/** Minimum height of each row in pixels, gutters included. */
	minRowHeight?: number;
};

/** Lays out cards in a responsive grid, each card stretched to the height of its row. */
const CardGrid = ({ children, breakpoints, minRowHeight, className, ...props }: CardGridProps) => (
	<Box rcx-grid__wrapper>
		<Box
			rcx-grid
			{...props}
			className={['rcx-card-grid', className]}
			style={
				minRowHeight === undefined
					? props.style
					: ({ '--rcx-card-grid-min-row-height': `${minRowHeight}px`, ...props.style } as CSSProperties)
			}
		>
			{Children.map(children, (child) => {
				if (child === null) {
					return null;
				}

				if (isValidElement(child) && child.type === CardGridItem) {
					return child;
				}

				return (
					<GridItem className='rcx-card-grid__item' {...breakpoints}>
						{child}
					</GridItem>
				);
			})}
		</Box>
	</Box>
);

export default CardGrid;
