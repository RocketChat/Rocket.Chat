import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppsUsageMeterProps = {
	label: ReactNode;
	count: ReactNode;
	title?: string;
	children: ReactNode;
};

/**
 * One kind of apps usage: its label and count on a line, the usage bar below.
 */
const AppsUsageMeter = ({ label, count, title, children }: AppsUsageMeterProps) => (
	<Box marginBlock='x12' title={title} display='flex' flexDirection='column' width='100%'>
		<Box display='flex' flexGrow='1' justifyContent='space-between' marginBlockEnd='x4'>
			{label}
			{count}
		</Box>
		{children}
	</Box>
);

export default AppsUsageMeter;
