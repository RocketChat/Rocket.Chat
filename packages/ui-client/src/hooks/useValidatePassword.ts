import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useValidatePassword = (password: string) => {
	const { data: passwordVerifications, isLoading } = useVerifyPassword(password);

	return useMemo(() => (isLoading ? undefined : passwordVerifications.every(({ isValid }) => isValid)), [isLoading, passwordVerifications]);
};
