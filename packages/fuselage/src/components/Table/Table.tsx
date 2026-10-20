import type { GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { TableFrame, TableWrapper } from './TableFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableProps = BoxProps & {
	striped?: boolean;
	sticky?: boolean;
	fixed?: boolean;
};

const Table = ({ striped, sticky, fixed = false, ...props }: TableProps) => {
	const tableProps = useTamaguiBoxProps({
		'rcx-table': true,
		'rcx-table--fixed': fixed,
		'rcx-table--sticky': sticky,
		'rcx-table--striped': striped,
		...props,
	});

	return (
		<TableWrapper className='rcx-table__wrapper'>
			<TableFrame fixed={fixed} {...(tableProps as GetProps<typeof TableFrame>)} />
		</TableWrapper>
	);
};

export default withFuselageProvider(Table, { takesBoxTransforms: true });
