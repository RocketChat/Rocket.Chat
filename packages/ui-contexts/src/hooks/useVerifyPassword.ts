import { PasswordPolicy } from '@rocket.chat/account-utils';
import { useQuery } from '@tanstack/react-query';

import { useEndpoint } from './useEndpoint';

const passwordPolicy = new PasswordPolicy({
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

const useSetActivePasswordPolicies = () => {
	const { data, isLoading } = useGetAllPasswordPolicies();

	if (isLoading) return;

	if (!data?.enabled) return;


}

// TODO: remove the passwordPolicy instance to a new file, to avoid using the endpoint at every useVerifyPassword call!

export const useVerifyPassword = (password: string) => {
	



	// TODO: setar a instância corretamente com os dados do endpoint!

	return passwordPolicy.sendValidationMessage(password);
};
