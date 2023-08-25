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
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>) => {
	const success = icon === 'success-circle';

	return (
		<Box display='flex' flexBasis='50%' alignItems='center' mbe={8} fontScale='c1' color={color} role='listitem' {...props}>
			<Icon name={icon} color={color} size='x16' mie={4} />
			<span aria-label={`${text} ${success ? 'checked' : 'unchecked'}`} />
			<span aria-hidden>{text}</span>
		</Box>
	);
};
