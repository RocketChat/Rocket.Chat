import type { GetProps } from '@tamagui/web';

import type { ElementProps } from '../../../types/ElementProps';
import { Box } from '../../Box';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { TableSelectionFrame } from '../TableFrames';

export type TableSelectionProps = ElementProps<HTMLDivElement> & {
	text?: string;
};

const TableSelection = ({ children, text, className, ...props }: TableSelectionProps) => (
	<TableSelectionFrame
		className={['rcx-table__selection', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof TableSelectionFrame>)}
	>
		<Box rcx-table__selection-text>{text}</Box>
		{children && <Box rcx-table__selection-actions>{children}</Box>}
	</TableSelectionFrame>
);

export default withFuselageProvider(TableSelection);
