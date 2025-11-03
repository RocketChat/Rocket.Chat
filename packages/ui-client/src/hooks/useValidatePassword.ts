import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useValidatePassword = (password: string): boolean => {
	const passwordVerifications = useVerifyPassword(password);

	return useMemo(() => passwordVerifications.valid, [passwordVerifications]);
};
