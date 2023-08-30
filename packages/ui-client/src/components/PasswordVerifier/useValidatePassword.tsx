import { useTranslation, useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useValidatePassword = (password: string) => {
	const t = useTranslation();

	const { data: passwordVerifications, isLoading } = useVerifyPassword(password);

	return useMemo(
		() => () =>
			isLoading || passwordVerifications.every(({ isValid }) => isValid) ? undefined : t('Password_must_meet_the_complexity_requirements'),
		[isLoading, passwordVerifications, t],
	);
};
