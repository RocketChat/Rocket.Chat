import { Box, Icon } from '@rocket.chat/fuselage';

export const PasswordVerifierItem = ({
	text,
	color,
	icon,
}: {
	text: string;
	color: 'status-font-on-success' | 'status-font-on-danger';
	icon: 'success-circle' | 'error-circle';
}) => (
	<Box display='flex' flexBasis='50%' alignItems='center' mbe='x8' fontScale='c1' color={color}>
		<Icon name={icon} color={color} size='x16' mie='x4' />
		{text}
	</Box>
);
