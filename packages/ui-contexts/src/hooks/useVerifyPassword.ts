import { passwordPolicy, useSetActivePasswordPolicies } from '../passwordPolicy';

// TODO: check if this is using the endpoint at every useVerifyPassword call!

export const useVerifyPassword = (password: string) => {
	useSetActivePasswordPolicies(); // TODO: check if the return statements are correct!

	return passwordPolicy.sendValidationMessage(password);
};
