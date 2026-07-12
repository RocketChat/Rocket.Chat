import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SettingsGroupLabelProps = {
	children: ReactNode;
};

const SettingsGroupLabel = ({ children }: SettingsGroupLabelProps) => (
	<Box is='h4' fontScale='micro' color='hint' style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }} mbe={8}>
		{children}
	</Box>
);

export default SettingsGroupLabel;
