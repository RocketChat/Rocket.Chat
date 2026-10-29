import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type LicenseFileFrameProps = {
	icon: ReactNode;
	name: ReactNode;
	details: ReactNode;
	action: ReactNode;
};

/**
 * The bordered row that shows a selected license file: its icon, its name over its details, and an action at the end.
 */
const LicenseFileFrame = ({ icon, name, details, action }: LicenseFileFrameProps) => (
	<Box display='flex' alignItems='center' padding='x4' borderRadius='medium' borderWidth='default' borderColor='extra-light'>
		{icon}
		<Box flexGrow={1} withTruncatedText marginInlineStart='x8' display='flex' flexDirection='column'>
			{name}
			<Box textTransform='uppercase'>{details}</Box>
		</Box>
		{action}
	</Box>
);

export default LicenseFileFrame;
