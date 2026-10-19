import type { GetProps } from '@tamagui/web';

import type { TableProps } from './Table';
import { TableBodyFrame } from './TableFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableBodyProps = TableProps;

const TableBody = (props: TableBodyProps) => {
	const bodyProps = useTamaguiBoxProps({ 'rcx-table__body': true, ...props });

	return <TableBodyFrame {...(bodyProps as GetProps<typeof TableBodyFrame>)} />;
};

export default withFuselageProvider(TableBody);
