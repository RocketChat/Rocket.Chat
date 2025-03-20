import { PasswordPolicy } from '@rocket.chat/password-policies';
import { useMemo } from 'react';

import { useSetting } from './useSetting';

type PasswordVerifications = { isValid: boolean; limit?: number; name: string }[];

export const useVerifyPassword = (password: string): PasswordVerifications => {
	const enabled = useSetting('Accounts_Password_Policy_Enabled', false);
	const minLength = useSetting('Accounts_Password_Policy_MinLength', 7);
	const maxLength = useSetting('Accounts_Password_Policy_MaxLength', -1);
	const forbidRepeatingCharacters = useSetting('Accounts_Password_Policy_ForbidRepeatingCharacters', true);
	const forbidRepeatingCharactersCount = useSetting('Accounts_Password_Policy_ForbidRepeatingCharactersCount', 3);
	const mustContainAtLeastOneLowercase = useSetting('Accounts_Password_Policy_AtLeastOneLowercase', true);
	const mustContainAtLeastOneUppercase = useSetting('Accounts_Password_Policy_AtLeastOneUppercase', true);
	const mustContainAtLeastOneNumber = useSetting('Accounts_Password_Policy_AtLeastOneNumber', true);
	const mustContainAtLeastOneSpecialCharacter = useSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter', true);

	const validator = useMemo(
		() =>
			new PasswordPolicy({
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

	return useMemo(() => validator.sendValidationMessage(password || ''), [password, validator]);
};
