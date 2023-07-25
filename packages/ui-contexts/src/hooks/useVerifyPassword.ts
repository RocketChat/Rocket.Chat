import { passwordPolicy } from '@rocket.chat/account-utils';

export const useVerifyPassword = (password: string) => {
	return passwordPolicy.sendValidationMessage(password);
};
