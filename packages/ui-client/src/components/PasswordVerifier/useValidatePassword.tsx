import { useTranslation, useVerifyPassword } from '@rocket.chat/ui-contexts';

export const useValidatePassword = (password: string) => {
	const t = useTranslation();

	const passwordVerifications = useVerifyPassword(password);
	return () => (passwordVerifications.every(({ isValid }) => isValid) ? undefined : t('Password_must_meet_the_complexity_requirements'));
};
