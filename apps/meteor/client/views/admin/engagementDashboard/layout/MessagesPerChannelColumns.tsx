import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type MessagesPerChannelColumnsProps = {
	chart: ReactNode;
	table: ReactNode;
};

/**
 * Where messages are sent: the chart of message origins beside the table of top channels, in two equal columns.
 */
const MessagesPerChannelColumns = ({ chart, table }: MessagesPerChannelColumnsProps) => (
	<Box display='flex' gap='x24'>
		<Box flexGrow={1} flexShrink={0} flexBasis='0'>
			{chart}
		</Box>
		<Box flexGrow={1} flexShrink={0} flexBasis='0'>
			{table}
		</Box>
	</Box>
);

export default MessagesPerChannelColumns;
