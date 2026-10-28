import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppLogsFilterBarProps = {
	children: ReactNode;
};

/**
 * The logs' filters and actions in a row that wraps, aligned on the bottom of their inputs.
 */
const AppLogsFilterBar = ({ children }: AppLogsFilterBarProps) => (
	<Box display='flex' alignItems='flex-end' flexDirection='row' width='full' flexWrap='wrap' alignContent='flex-end' columnGap='x8'>
		{children}
	</Box>
);

export default AppLogsFilterBar;
