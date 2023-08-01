import { PasswordPolicy } from '@rocket.chat/account-utils';
import { useQuery } from '@tanstack/react-query';

import { useEndpoint } from './hooks/useEndpoint';

export const passwordPolicy = new PasswordPolicy({
	enabled: false,
	minLength: -1,
	maxLength: -1,
	forbidRepeatingCharacters: false,
	forbidRepeatingCharactersCount: 3, // the regex is this number minus one
	mustContainAtLeastOneLowercase: false, // /[A-Z]{3,}/ could do this instead of at least one
	mustContainAtLeastOneUppercase: false,
	mustContainAtLeastOneNumber: false,
	mustContainAtLeastOneSpecialCharacter: false,
	throwError: true,
});

const useGetAllPasswordPolicies = () => {
	const getAllPolicies = useEndpoint('GET', '/v1/pw.getAllPolicies');

	return useQuery(['login', 'password-policy'], async () => getAllPolicies());
};

/**
 * This method copies the active policies from the instance on the backend (`apps/meteor/app/lib/server/lib/passwordPolicy.ts`) to update this instance on the frontend
 */
export const useSetActivePasswordPolicies = () => {
	const { data, isLoading } = useGetAllPasswordPolicies();

	if (isLoading) return;

	if (!data?.enabled) return;

	// TODO: use object literals instead of switch cases!
	data.policy.forEach((element) => {
		switch (element.name) {
			case 'get-password-policy-minLength':
				passwordPolicy.minLength = Number(element.limit);
				break;
			case 'get-password-policy-maxLength':
				passwordPolicy.maxLength = Number(element.limit);
				break;
			case 'get-password-policy-forbidRepeatingCharacters':
				passwordPolicy.forbidRepeatingCharacters = true;
				// TODO: how to adapt the limit property to create a more generic approach, instead of manually passing 'true'?
				break;
			case 'get-password-policy-forbidRepeatingCharactersCount':
				passwordPolicy.forbidRepeatingCharactersCount = Number(element.limit);
				break;
			case 'get-password-policy-mustContainAtLeastOneLowercase':
				passwordPolicy.passwordAtLeastOneLowercase = true;
				break;
			case 'get-password-policy-mustContainAtLeastOneUppercase':
				passwordPolicy.passwordAtLeastOneUppercase = true;
				break;
			case 'get-password-policy-mustContainAtLeastOneSpecialCharacter':
				passwordPolicy.passwordAtLeastOneSpecialCharacter = true;
				break;

			default:
				break;
		}
	});
};
