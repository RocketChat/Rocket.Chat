import { styled, View } from '@tamagui/web';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

// Declared where it renders: zero-runtime only erases a `styled()` whose every use is in its own module
const TableBodyFrame = styled(View, {
	render: 'tbody',
	display: 'table-row-group',
	flexDirection: 'row',
	alignItems: 'normal',
	position: 'static',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

export type TableBodyProps = ElementProps<HTMLTableSectionElement>;

const TableBody = ({ children, className, ref, ...props }: TableBodyProps) => (
	<TableBodyFrame render={<Box is='tbody' rcx-table__body {...props} ref={ref} />} className={className}>
		{children}
	</TableBodyFrame>
);

export default TableBody;
