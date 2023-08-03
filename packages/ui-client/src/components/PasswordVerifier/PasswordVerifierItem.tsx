import { Box, Icon } from '@rocket.chat/fuselage';
import { AllHTMLAttributes } from 'react';

export const PasswordVerifierItem = ({
	text,
	color,
	icon,
	...props
}: {
	text: string;
	color: 'status-font-on-success' | 'status-font-on-danger';
	icon: 'success-circle' | 'error-circle';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>) => (
	<Box display='flex' flexBasis='50%' alignItems='center' mbe='x8' fontScale='c1' color={color} role='listitem' {...props}>
		<Icon name={icon} color={color} size='x16' mie='x4' />
		{text}
	</Box>
);
