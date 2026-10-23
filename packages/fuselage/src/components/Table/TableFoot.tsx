import type { GetProps } from '@tamagui/web';

import { TableFootFrame } from './TableFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableFootProps = ElementProps<HTMLTableSectionElement>;

const TableFoot = (props: TableFootProps) => {
	const footProps = useTamaguiBoxProps({ 'rcx-table__foot': true, ...props });

	return <TableFootFrame {...(footProps as GetProps<typeof TableFootFrame>)} />;
};

export default withFuselageProvider(TableFoot);
