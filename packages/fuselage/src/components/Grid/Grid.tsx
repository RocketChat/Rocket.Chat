import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import GridItem from './GridItem';

export type GridProps = ElementProps<HTMLDivElement> & {
	/** Uses the `xs` gutter and item spans even on a narrower viewport. */
	xs?: boolean;
	/** Uses the `sm` gutter and item spans even on a narrower viewport, for a grid in a space narrower than the screen. */
	sm?: boolean;
	/** Uses the `md` gutter and item spans even on a narrower viewport, for a grid in a space narrower than the screen. */
	md?: boolean;
	/** Uses the `lg` gutter and item spans even on a narrower viewport, for a grid in a space narrower than the screen. */
	lg?: boolean;
	/** Uses the `xl` gutter and item spans even on a narrower viewport, for a grid in a space narrower than the screen. */
	xl?: boolean;
};

/**
 * Places `GridItem`s on a grid of columns that follows the viewport: 4 columns on the narrowest screens, 8 and then 12
 * on wider ones, with gutters that widen too.
 */
const Grid = ({ xs, sm, md, lg, xl, ...props }: GridProps) => (
	<Box rcx-grid__wrapper>
		<Box rcx-grid rcx-grid--xs={xs} rcx-grid--sm={sm} rcx-grid--md={md} rcx-grid--lg={lg} rcx-grid--xl={xl} {...props} />
	</Box>
);

Grid.Item = GridItem;

export default Grid;
