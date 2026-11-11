import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type GridItemProps = ElementProps<HTMLDivElement> & {
	xs?: 1 | 2 | 3 | 4;
	sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
	xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

const GridItem = ({ xs, sm, md, lg, xl, ...props }: GridItemProps) => (
	<Box
		rcx-grid__item
		rcx-grid__item--xs={xs}
		rcx-grid__item--sm={sm}
		rcx-grid__item--md={md}
		rcx-grid__item--lg={lg}
		rcx-grid__item--xl={xl}
		{...props}
	/>
);

export default GridItem;
