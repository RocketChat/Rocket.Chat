import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type passwordVerificationsType = {
	name: string;
	isValid: boolean;
	limit?: number;
}[];

export const useValidatePassword = (password: string): boolean => {
	const passwordVerifications: passwordVerificationsType = useVerifyPassword(password);

	return useMemo(() => passwordVerifications.every(({ isValid }) => isValid), [passwordVerifications]);
};
