import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type GridItemProps = ElementProps<HTMLDivElement> & {
	/** Columns the item spans, out of 4, from the `xs` breakpoint up. */
	xs?: 1 | 2 | 3 | 4;
	/** Columns the item spans, out of 8, from the `sm` breakpoint up. */
	sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	/** Columns the item spans, out of 8, from the `md` breakpoint up. */
	md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	/** Columns the item spans, out of 12, from the `lg` breakpoint up. */
	lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
	/** Columns the item spans, out of 12, from the `xl` breakpoint up. */
	xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

/**
 * A cell of a `Grid`. An item with no span for the viewport's width takes an equal share of the room left in its row.
 */
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
