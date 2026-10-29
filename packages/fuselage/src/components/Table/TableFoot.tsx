import { styled, View } from '@tamagui/web';

import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';

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
	<TableFootFrame render={<tfoot {...props} ref={ref} />} className={cx('rcx-box rcx-box--full', 'rcx-table__foot', className)}>
		{children}
	</TableFootFrame>
);

export default TableFoot;
