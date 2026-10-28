import { Box, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type LicenseDetailProps = {
	label: ReactNode;
	action: ReactNode;
	children: ReactNode;
};

/**
 * A license detail: its label followed by an action, and its value below.
 */
const LicenseDetail = ({ label, action, children }: LicenseDetailProps) => (
	<Box>
		<Stack direction='row' gap='x4'>
			{label}
			{action}
		</Stack>
		{children}
	</Box>
);

export default LicenseDetail;
