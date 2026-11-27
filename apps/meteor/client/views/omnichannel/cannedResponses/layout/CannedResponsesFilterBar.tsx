import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { Children } from 'react';

export type CannedResponsesFilterBarProps = {
	children: ReactNode;
};

/**
 * The labelled search and filters above the canned responses table, sharing one row in equal widths.
 */
const CannedResponsesFilterBar = ({ children }: CannedResponsesFilterBarProps) => (
	<Box marginBlock='x16' display='flex' flexDirection='row' columnGap='x8' paddingInlineEnd='x8'>
		{Children.map(children, (child) => (child === null ? null : <Box flexGrow={1}>{child}</Box>))}
	</Box>
);

export default CannedResponsesFilterBar;
