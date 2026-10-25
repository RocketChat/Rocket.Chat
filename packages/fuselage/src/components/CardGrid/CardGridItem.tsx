import type { ReactNode } from 'react';

import type { GridItemProps } from '../Grid';
import { GridItem } from '../Grid';

export type CardGridItemProps = Pick<GridItemProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> & {
	children: ReactNode;
};

/**
 * A `CardGrid` cell with its own column spans, for grids whose cards are not all the same width.
 */
const CardGridItem = ({ children, xs, sm, md, lg, xl }: CardGridItemProps) => (
	<GridItem className='rcx-card-grid__item' xs={xs} sm={sm} md={md} lg={lg} xl={xl}>
		{children}
	</GridItem>
);

export default CardGridItem;
