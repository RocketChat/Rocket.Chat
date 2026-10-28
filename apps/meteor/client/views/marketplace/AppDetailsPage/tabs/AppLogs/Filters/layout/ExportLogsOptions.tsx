import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ExportLogsOptionsProps = {
	children: ReactNode;
};

/**
 * The groups of choices in the export logs modal, with room below the last one.
 */
const ExportLogsOptions = ({ children }: ExportLogsOptionsProps) => (
	<Box display='flex' flexDirection='column' gap='x24' paddingBlockEnd='x24'>
		{children}
	</Box>
);

export default ExportLogsOptions;
