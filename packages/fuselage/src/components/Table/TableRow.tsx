import type { GetProps } from '@tamagui/web';

import { TableRowFrame } from './TableFrames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableRowProps = ElementProps<HTMLTableRowElement> & {
	selected?: boolean;
	action?: boolean;
	hasAction?: boolean;
};

const TableRow = ({ action, selected, className, ...props }: TableRowProps) => {
	const scheme = [selected && 'selected', action && 'action'].filter(Boolean).join('-') || undefined;
	const disabled = action && className?.split(/\s+/).includes('disabled');

	return (
		<TableRowFrame
			{...{ scheme }}
			{...(disabled && { cursor: { hover: 'not-allowed', focus: 'not-allowed' } })}
			className={['rcx-table__row', selected && 'rcx-table__row--selected', action && 'rcx-table__row--action', className]
				.filter(Boolean)
				.join(' ')}
			{...(props as GetProps<typeof TableRowFrame>)}
		/>
	);
};

export default withFuselageProvider(TableRow);
