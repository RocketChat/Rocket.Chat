import { css } from '@rocket.chat/css-in-js';
import type { ReactNode } from 'react';
import { Children, isValidElement } from 'react';

import CardGridItem from './CardGridItem';
import { useStyle } from '../../hooks/useStyle';
import type { GridItemProps } from '../Grid';
import { Grid, GridItem } from '../Grid';

export type CardGridProps = {
	children: ReactNode;
	breakpoints?: GridItemProps;
	/** Minimum height of each row in pixels, gutters included. */
	minRowHeight?: number;
};

const CardGrid = ({ children, breakpoints, minRowHeight }: CardGridProps) => {
	const rowHeightClassName = useStyle(
		minRowHeight !== undefined
			? css`
					& > .rcx-card-grid__item {
						min-height: ${minRowHeight}px;
					}
				`
			: undefined,
	);

	return (
		<Grid className={['rcx-card-grid', rowHeightClassName].filter(Boolean).join(' ')}>
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
};

export default CardGrid;
