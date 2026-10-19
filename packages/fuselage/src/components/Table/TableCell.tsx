import type { GetProps } from '@tamagui/web';
import { useContext } from 'react';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { Box } from '../Box';
import type { TableProps } from './Table';
import { TableCellFrame } from './TableFrames';
import { TableHeadContext } from './TableHead';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableCellProps = TableProps & {
	align?: 'start' | 'center' | 'end' | 'justify' | object;
	clickable?: boolean;
};

const TableCell = ({ align, clickable, children, ...props }: TableCellProps) => {
	const isInsideHead = useContext(TableHeadContext);

	const innerElement = children ?? (!isInsideHead ? <Box display='inline-block' is='hr' width='x14' borderWidth='default' /> : undefined);

	const cellProps = useTamaguiBoxProps({
		'is': isInsideHead ? 'th' : 'td',
		'rcx-table__cell': true,
		'rcx-table__cell--align': align,
		'rcx-table__cell--header': isInsideHead,
		'rcx-table__cell--clickable': clickable,
		...props,
	});

	return (
		<TableCellFrame
			header={isInsideHead}
			clickable={clickable}
			align={typeof align === 'string' ? align : undefined}
			{...(cellProps as GetProps<typeof TableCellFrame>)}
		>
			{innerElement}
		</TableCellFrame>
	);
};

export default withFuselageProvider(TableCell);
