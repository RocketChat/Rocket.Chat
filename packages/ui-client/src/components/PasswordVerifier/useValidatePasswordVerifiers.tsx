import { useVerifyPassword } from '@rocket.chat/ui-contexts';

export const useValidatePasswordVerifiers = (password: string) => {
	const passwordVerifications = useVerifyPassword(password);
	return () => (passwordVerifications.every(({ isValid }) => isValid) ? 'success' : 'Password must meet the complexity requirements.');
};
