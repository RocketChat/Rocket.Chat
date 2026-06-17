import { Box } from '@rocket.chat/fuselage';

const AppSecurityLabel = ({ children }: { children: string }) => (
	<Box fontScale='h4' mbe={8} color='titles-labels'>
		{children}
	</Box>
);

export default AppSecurityLabel;
