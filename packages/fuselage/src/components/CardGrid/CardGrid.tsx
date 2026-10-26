import type { CSSProperties, ReactNode } from 'react';
import { Children, isValidElement } from 'react';

import CardGridItem from './CardGridItem';
import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import type { GridItemProps } from '../Grid';
import { Grid, GridItem } from '../Grid';

export type CardGridProps = Omit<ElementProps<HTMLDivElement>, 'children'> & {
	children: ReactNode;
	breakpoints?: GridItemProps;
	/** Minimum height of each row in pixels, gutters included. */
	minRowHeight?: number;
};

const CardGrid = ({ children, breakpoints, minRowHeight, className, style, ...props }: CardGridProps) => (
	<Grid
		{...props}
		className={cx('rcx-card-grid', className)}
		style={minRowHeight === undefined ? style : ({ '--rcx-card-grid-min-row-height': `${minRowHeight}px`, ...style } as CSSProperties)}
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
	</Grid>
);

export default CardGrid;
