import type { GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { TableRowFrame } from './TableFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type TableRowProps = Omit<BoxProps, 'action'> & {
	action?: boolean;
	hasAction?: boolean;
};

const TableRow = ({ action, selected, ...props }: TableRowProps) => {
	const rowProps = useTamaguiBoxProps({
		'rcx-table__row': true,
		'rcx-table__row--selected': selected,
		'rcx-table__row--action': action,
		...props,
	});

	const scheme = [selected && 'selected', action && 'action'].filter(Boolean).join('-') || undefined;
	const disabled = action && typeof rowProps.className === 'string' && rowProps.className.split(/\s+/).includes('disabled');

	return (
		<TableRowFrame
			{...{ scheme }}
			{...(disabled && { cursor: { hover: 'not-allowed', focus: 'not-allowed' } })}
			{...(rowProps as GetProps<typeof TableRowFrame>)}
		/>
	);
};

export default withFuselageProvider(TableRow, { takesBoxTransforms: true });
