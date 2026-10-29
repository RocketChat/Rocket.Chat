import { Box } from '@rocket.chat/fuselage';

export type AppSecurityLabelProps = { children: string };

const AppSecurityLabel = ({ children }: AppSecurityLabelProps) => (
	<Box fontScale='h4' marginBlockEnd={8} color='titles-labels'>
		{children}
	</Box>
);

export default AppSecurityLabel;
