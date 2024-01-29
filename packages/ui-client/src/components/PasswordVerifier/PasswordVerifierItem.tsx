import { Box, Icon } from '@rocket.chat/fuselage';
import { AllHTMLAttributes, ComponentProps } from 'react';

const variants: {
	[key: string]: {
		icon: ComponentProps<typeof Icon>['name'];
		color: string;
	};
} = {
	success: {
		icon: 'success-circle',
		color: 'status-font-on-success',
	},
	error: {
		icon: 'error-circle',
		color: 'status-font-on-danger',
	},
};

export const PasswordVerifierItem = ({
	text,
	isValid,
	...props
}: { text: string; isValid: boolean } & Omit<AllHTMLAttributes<HTMLElement>, 'is'>) => {
	const { icon, color } = variants[isValid ? 'success' : 'error'];
	return (
		<Box
			display='flex'
			flexBasis='50%'
			alignItems='center'
			mbe={8}
			fontScale='c1'
			color={color}
			role='listitem'
			aria-label={text}
			{...props}
		>
			<Icon name={icon} color={color} size='x16' mie={4} />
			<span aria-hidden>{text}</span>
		</Box>
	);
};
