import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';
import { createContext } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import type { PartAttributes } from '../../types/ElementAttributes';

export const TableHeadContext = createContext(false);

// Declared where it renders: zero-runtime only erases a `styled()` whose every use is in its own module
const TableHeadFrame = styled(View, {
	render: 'thead',
	display: 'table-header-group',
	flexDirection: 'row',
	alignItems: 'normal',
	position: 'static',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

export type TableHeadProps = {
	children?: ReactNode;
} & PartAttributes<HTMLTableSectionElement>;

const TableHead = (props: TableHeadProps) => (
	<TableHeadContext.Provider value={true}>
		<TableHeadFrame
			render={<thead {...ariaAndDataAttributes(props)} ref={props.ref} id={props.id} title={props.title} />}
			className={cx('rcx-box rcx-box--full', 'rcx-table__head', props.className)}
		>
			{props.children}
		</TableHeadFrame>
	</TableHeadContext.Provider>
);

export default TableHead;
