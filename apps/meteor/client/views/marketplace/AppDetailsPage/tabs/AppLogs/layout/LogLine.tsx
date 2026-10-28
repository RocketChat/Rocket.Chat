import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type LogLineProps = {
	children: ReactNode;
};

/**
 * One line of a log entry's summary, in the monospaced font.
 */
const LogLine = ({ children }: LogLineProps) => (
	<Box lineHeight={20} marginBlockEnd='x4' fontFamily='mono'>
		{children}
	</Box>
);

export default LogLine;
