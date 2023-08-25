import { Box, Icon } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
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
	const id = useUniqueId();
	return (
		<Box display='flex' flexBasis='50%' alignItems='center' mbe={8} fontScale='c1' color={color} role='listitem' {...props}>
			<Icon name={icon} color={color} size='x16' mie={4} />
			<span role='checkbox' aria-checked={success ? 'true' : 'false'} tabIndex={0} aria-labelledby={id} aria-readonly={true}></span>
			<label id={id} aria-hidden>
				{text}
			</label>
		</Box>
	);
};
