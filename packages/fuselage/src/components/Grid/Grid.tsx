import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import GridItem from './GridItem';

export type GridProps = ElementProps<HTMLDivElement> & {
	xs?: boolean;
	sm?: boolean;
	md?: boolean;
	lg?: boolean;
	xl?: boolean;
};

const Grid = ({ xs, sm, md, lg, xl, ...props }: GridProps) => (
	<Box rcx-grid__wrapper>
		<Box rcx-grid rcx-grid--xs={xs} rcx-grid--sm={sm} rcx-grid--md={md} rcx-grid--lg={lg} rcx-grid--xl={xl} {...props} />
	</Box>
);

Grid.Item = GridItem;

export default Grid;
