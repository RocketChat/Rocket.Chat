import { Box, Icon, type IconProps } from '@rocket.chat/fuselage';
import type { PasswordPolicyValidation } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

const variants = {
	success: {
		name: 'success-circle',
		color: 'status-font-on-success',
	},
	error: {
		name: 'error-circle',
		color: 'status-font-on-danger',
	},
} satisfies Record<string, IconProps>;

type PasswordVerifierItemProps = PasswordPolicyValidation & {
	vertical: boolean;
};

export const PasswordVerifierItem = (props: PasswordVerifierItemProps) => {
	const { t } = useTranslation();
	const { name, color } = variants[props.isValid ? 'success' : 'error'];
	const label = t(`${props.name}-label`, 'limit' in props ? { limit: props.limit } : undefined);
	return (
		<Box
			display='flex'
			flexBasis={props.vertical ? '100%' : '50%'}
			alignItems='center'
			mbe={8}
			fontScale='c1'
			color={color}
			role='listitem'
			aria-label={label}
		>
			<Icon name={name} color={color} size='x16' mie={4} />
			<span aria-hidden>{label}</span>
		</Box>
	);
};
