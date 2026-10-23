import type { GetProps } from '@tamagui/web';

import { TableBodyFrame } from './TableFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableBodyProps = ElementProps<HTMLTableSectionElement>;

const TableBody = (props: TableBodyProps) => {
	const bodyProps = useTamaguiBoxProps({ 'rcx-table__body': true, ...props });

	return <TableBodyFrame {...(bodyProps as GetProps<typeof TableBodyFrame>)} />;
};

export default withFuselageProvider(TableBody);
