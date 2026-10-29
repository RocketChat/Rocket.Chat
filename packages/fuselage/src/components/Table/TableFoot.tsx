import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import type { PartAttributes } from '../../types/ElementAttributes';

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

export type TableFootProps = {
	children?: ReactNode;
} & PartAttributes<HTMLTableSectionElement>;

const TableFoot = (props: TableFootProps) => (
	<TableFootFrame
		render={<tfoot {...ariaAndDataAttributes(props)} ref={props.ref} id={props.id} title={props.title} />}
		className={cx('rcx-box rcx-box--full', 'rcx-table__foot', props.className)}
	>
		{props.children}
	</TableFootFrame>
);

export default TableFoot;
