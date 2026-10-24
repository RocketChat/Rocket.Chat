import type { GetProps } from '@tamagui/web';

import { TableBodyFrame } from './TableFrames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableBodyProps = ElementProps<HTMLTableSectionElement>;

const TableBody = ({ className, ...props }: TableBodyProps) => {
	return (
		<TableBodyFrame className={['rcx-table__body', className].filter(Boolean).join(' ')} {...(props as GetProps<typeof TableBodyFrame>)} />
	);
};

export default withFuselageProvider(TableBody);
