import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import type { PartAttributes } from '../../types/ElementAttributes';

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

export type TableBodyProps = {
	children?: ReactNode;
} & PartAttributes<HTMLTableSectionElement>;

const TableBody = (props: TableBodyProps) => (
	<TableBodyFrame
		render={<tbody {...ariaAndDataAttributes(props)} ref={props.ref} id={props.id} title={props.title} />}
		className={cx('rcx-box rcx-box--full', 'rcx-table__body', props.className)}
	>
		{props.children}
	</TableBodyFrame>
);

export default TableBody;
