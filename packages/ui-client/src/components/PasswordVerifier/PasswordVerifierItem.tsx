import { Box, Icon, type IconProps } from '@rocket.chat/fuselage';
import type { PasswordPolicyValidation } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

const variants = {
	success: {
		name: 'success-circle',
		label: 'Success',
		color: 'status-font-on-success',
	},
	error: {
		name: 'error-circle',
		label: 'Error',
		color: 'status-font-on-danger',
	},
} as const satisfies Record<string, IconProps>;

type PasswordVerifierItemProps = PasswordPolicyValidation & {
	vertical: boolean;
};

export const PasswordVerifierItem = (props: PasswordVerifierItemProps) => {
	const { t } = useTranslation();
	const id = useId();
	const icon = variants[props.isValid ? 'success' : 'error'];
	const name = `${props.name}-label` as const;
	const requirementText = t(name, 'limit' in props ? { limit: props.limit } : undefined);
	return (
		<Box
			display='flex'
			flexBasis={props.vertical ? '100%' : '50%'}
			alignItems='center'
			mbe={8}
			fontScale='c1'
			color={icon.color}
			role='listitem'
			aria-hidden='false'
			aria-labelledby={`${id}-icon ${id}-text`}
		>
			<Icon id={`${id}-icon`} aria-label={t(icon.label)} aria-hidden='false' name={icon.name} color={icon.color} size='x16' mie={4} />
			<span id={`${id}-text`}>{requirementText}</span>
		</Box>
	);
};
