import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppLogsToolbarProps = {
	children: ReactNode;
};

/**
 * The band above the logs that holds their filters and actions.
 */
const AppLogsToolbar = ({ children }: AppLogsToolbarProps) => <Box paddingBlock='x16'>{children}</Box>;

export default AppLogsToolbar;
