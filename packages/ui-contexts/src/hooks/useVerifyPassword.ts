import PasswordPolicy from '@rocket.chat/account-utils';
import { useMemo } from 'react';

import { useSetting } from './useSetting';

type PasswordVerifications = { isValid: boolean; limit?: number; name: string }[];

export const useVerifyPassword = (password: string): PasswordVerifications => {
	const enabled = Boolean(useSetting('Accounts_Password_Policy_Enabled'));
	const minLength = Number(useSetting('Accounts_Password_Policy_MinLength'));
	const maxLength = Number(useSetting('Accounts_Password_Policy_MaxLength'));
	const forbidRepeatingCharacters = Boolean(useSetting('Accounts_Password_Policy_ForbidRepeatingCharacters'));
	const forbidRepeatingCharactersCount = Number(useSetting('Accounts_Password_Policy_ForbidRepeatingCharactersCount'));
	const mustContainAtLeastOneLowercase = Boolean(useSetting('Accounts_Password_Policy_AtLeastOneLowercase'));
	const mustContainAtLeastOneUppercase = Boolean(useSetting('Accounts_Password_Policy_AtLeastOneUppercase'));
	const mustContainAtLeastOneNumber = Boolean(useSetting('Accounts_Password_Policy_AtLeastOneNumber'));
	const mustContainAtLeastOneSpecialCharacter = Boolean(useSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter'));

	const validator = useMemo(
		() =>
			new PasswordPolicy.PasswordPolicy({
				enabled,
				minLength,
				maxLength,
				forbidRepeatingCharacters,
				forbidRepeatingCharactersCount,
				mustContainAtLeastOneLowercase,
				mustContainAtLeastOneUppercase,
				mustContainAtLeastOneNumber,
				mustContainAtLeastOneSpecialCharacter,
				throwError: true,
			}),
		[
			enabled,
			minLength,
			maxLength,
			forbidRepeatingCharacters,
			forbidRepeatingCharactersCount,
			mustContainAtLeastOneLowercase,
			mustContainAtLeastOneUppercase,
			mustContainAtLeastOneNumber,
			mustContainAtLeastOneSpecialCharacter,
		],
	);

	return useMemo(() => validator.sendValidationMessage(password), [password, validator]);
};
