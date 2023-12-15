import { Box, Icon } from '@rocket.chat/fuselage';
import { AllHTMLAttributes, ComponentProps } from 'react';

export const variants: {
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
	default: {
		icon: 'info',
		color: 'font-titles-labels',
	},
};

export const PasswordVerifierItem = ({
	text,
	variant,
	...props
}: { text: string; variant: keyof typeof variants } & Omit<AllHTMLAttributes<HTMLElement>, 'is'>) => {
	const { icon, color } = variants[variant];
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
