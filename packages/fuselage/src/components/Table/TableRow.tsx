import type { GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { TableRowFrame } from './TableFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableRowProps = Omit<BoxProps, 'action'> & {
	action?: boolean;
};

const TableRow = ({ action, selected, ...props }: TableRowProps) => {
	const rowProps = useTamaguiBoxProps({
		'rcx-table__row': true,
		'rcx-table__row--selected': selected,
		'rcx-table__row--action': action,
		...props,
	});

	return <TableRowFrame selected={selected} {...(rowProps as GetProps<typeof TableRowFrame>)} />;
};

export default withFuselageProvider(TableRow);
