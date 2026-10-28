import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppLogsItemHeadingProps = {
	children: ReactNode;
};

/**
 * The bold heading above the full log of an expanded log entry.
 */
const AppLogsItemHeading = ({ children }: AppLogsItemHeadingProps) => (
	<Box marginBlockStart='x16' fontWeight={700}>
		{children}
	</Box>
);

export default AppLogsItemHeading;
