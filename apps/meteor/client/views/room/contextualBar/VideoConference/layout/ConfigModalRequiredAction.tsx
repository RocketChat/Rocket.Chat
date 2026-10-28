import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ConfigModalRequiredActionProps = {
	children: ReactNode;
};

/**
 * The closing section of the conference configuration modal, set apart from the sections above and the footer.
 */
const ConfigModalRequiredAction = ({ children }: ConfigModalRequiredActionProps) => (
	<Box display='flex' flexDirection='column' gap='x12' marginBlock='x24'>
		{children}
	</Box>
);

export default ConfigModalRequiredAction;
