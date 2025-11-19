import { Box, Icon, type IconProps } from '@rocket.chat/fuselage';
import type { PasswordPolicyValidation } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation, type UseTranslationResponse } from 'react-i18next';

type PasswordVerifierItemProps = PasswordPolicyValidation & {
	vertical: boolean;
};

const getIconProps = (
	isValid: boolean,
	t: UseTranslationResponse<'translation', undefined>['t'],
): Pick<Required<IconProps>, 'name' | 'aria-label' | 'color'> =>
	isValid
		? {
				'name': 'success-circle',
				'aria-label': t('Success'),
				'color': 'status-font-on-success',
			}
		: {
				'name': 'error-circle',
				'aria-label': t('Error'),
				'color': 'status-font-on-danger',
			};

export const PasswordVerifierItem = ({ isValid, ...props }: PasswordVerifierItemProps) => {
	const { t } = useTranslation();
	const icon = getIconProps(isValid, t);
	const id = useId();
	const iconId = `${id}-icon`;
	const textId = `${id}-text`;
	const requirementText = t(`${props.name}-label` as const, 'limit' in props ? { limit: props.limit } : undefined);
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
			aria-labelledby={`${iconId} ${textId}`}
		>
			<Icon id={iconId} aria-hidden='false' size='x16' mie={4} {...icon} />
			<span id={textId}>{requirementText}</span>
		</Box>
	);
};
