import type { ReactNode } from 'react';
import { Children } from 'react';

import type { GridItemProps } from '../Grid';
import { Grid, GridItem } from '../Grid';

export type CardGridProps = {
	children: ReactNode;
	breakpoints?: GridItemProps;
};

const CardGrid = ({ children, breakpoints, ...props }: CardGridProps) => (
	<Grid className='rcx-card-grid' {...props}>
		{Children.map(children, (child) => (
			<GridItem className='rcx-card-grid__item' {...breakpoints}>
				{child}
			</GridItem>
		))}
	</Grid>
);

export default CardGrid;
