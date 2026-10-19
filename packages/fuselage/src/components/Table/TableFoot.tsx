import type { GetProps } from '@tamagui/web';

import type { TableProps } from './Table';
import { TableFootFrame } from './TableFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableFootProps = TableProps;

const TableFoot = (props: TableFootProps) => {
	const footProps = useTamaguiBoxProps({ 'rcx-table__foot': true, ...props });

	return <TableFootFrame {...(footProps as GetProps<typeof TableFootFrame>)} />;
};

export default withFuselageProvider(TableFoot);
