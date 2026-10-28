import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppStatusBarProps = {
	children: ReactNode;
};

/**
 * An app's acquire button and status tags in a row, kept apart from the app menu that follows it.
 */
const AppStatusBar = ({ children }: AppStatusBarProps) => (
	<Box display='flex' alignItems='center' marginInlineEnd='x8'>
		{children}
	</Box>
);

export default AppStatusBar;
