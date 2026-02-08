import { useTranslation } from 'react-i18next';
import { useValidatePassword } from '@rocket.chat/ui-client';

type Params = {
	requireNameForRegister: boolean;
	requiresPasswordConfirmation: boolean;
	password: string;
};

export const useRegisterValidation = ({ requireNameForRegister, requiresPasswordConfirmation, password }: Params) => {
	const { t } = useTranslation();
	const passwordIsValid = useValidatePassword(password);

	return {
		name: {
			required: requireNameForRegister ? t('Required_field', { field: t('registration.component.form.name') }) : false,
		},
		email: {
			required: t('Required_field', { field: t('registration.component.form.email') }),
			pattern: {
				value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
				message: t('registration.component.form.invalidEmail'),
			},
		},
		username: {
			required: t('Required_field', { field: t('registration.component.form.username') }),
		},
		password: {
			required: t('Required_field', { field: t('registration.component.form.password') }),
			validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
		},
		passwordConfirmation: requiresPasswordConfirmation
			? {
					required: t('Required_field', { field: t('registration.component.form.confirmPassword') }),
					deps: ['password'],
					validate: (val: string, values: any) =>
						values.password === val ? true : t('registration.component.form.invalidConfirmPass'),
			  }
			: undefined,
		reason: {
			required: t('Required_field', { field: t('registration.component.form.reasonToJoin') }),
		},
	};
};
