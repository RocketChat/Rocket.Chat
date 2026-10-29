import { styled, View } from '@tamagui/web';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

// Declared where it renders: zero-runtime only erases a `styled()` whose every use is in its own module
const TableFootFrame = styled(View, {
	render: 'tfoot',
	display: 'table-footer-group',
	flexDirection: 'row',
	alignItems: 'normal',
	position: 'static',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

export type TableFootProps = ElementProps<HTMLTableSectionElement>;

const TableFoot = ({ children, className, ref, ...props }: TableFootProps) => (
	<TableFootFrame render={<Box is='tfoot' rcx-table__foot {...props} ref={ref} />} className={className}>
		{children}
	</TableFootFrame>
);

export default TableFoot;
