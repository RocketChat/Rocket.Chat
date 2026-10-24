import type { GetProps } from '@tamagui/web';

import { TableFootFrame } from './TableFrames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableFootProps = ElementProps<HTMLTableSectionElement>;

const TableFoot = ({ className, ...props }: TableFootProps) => {
	return (
		<TableFootFrame className={['rcx-table__foot', className].filter(Boolean).join(' ')} {...(props as GetProps<typeof TableFootFrame>)} />
	);
};

export default withFuselageProvider(TableFoot);
