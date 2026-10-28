import { Text } from '@rocket.chat/fuselage';

export type AppSecurityLabelProps = { children: string };

const AppSecurityLabel = ({ children }: AppSecurityLabelProps) => (
	<Text fontScale='h4' color='titles-labels'>
		{children}
	</Text>
);

export default AppSecurityLabel;
