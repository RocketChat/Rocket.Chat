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
		<Box fontScale='p2b' marginBlock={16} flexShrink={1} withTruncatedText>
			{text}
		</Box>
		{children && (
			<Box marginInline='neg-x8' fontScale='p2m' flexShrink={0}>
				{children}
			</Box>
		)}
	</TableSelectionFrame>
);

export default withFuselageProvider(TableSelection);
