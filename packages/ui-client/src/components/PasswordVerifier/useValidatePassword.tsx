import { useVerifyPassword } from '@rocket.chat/ui-contexts';

export const useValidatePassword = (password: string) => {
	const passwordVerifications = useVerifyPassword(password);
	return () => (passwordVerifications.every(({ isValid }) => isValid) ? undefined : 'Password must meet the complexity requirements.');
};
