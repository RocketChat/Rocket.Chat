import { useVerifyPassword } from '@rocket.chat/ui-contexts';

export const useValidatePassword = (password: string): boolean => {
	const passwordVerifications = useVerifyPassword(password);
	return passwordVerifications.valid;
};
