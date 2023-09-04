import { PasswordPolicy } from '@rocket.chat/account-utils';
import { useMemo } from 'react';

import { useSetting } from './useSetting';

export const passwordVerificationsTemplate: Record<string, (password: string, lengthCriteria?: number) => boolean> = {
	'get-password-policy-minLength': (password: string, minLength?: number) => Boolean(minLength && password.length >= minLength),
	'get-password-policy-maxLength': (password: string, maxLength?: number) => Boolean(maxLength && password.length <= maxLength),
	'get-password-policy-forbidRepeatingCharactersCount': (password: string, maxRepeatingChars?: number) => {
		const repeatingCharsHash = {} as Record<string, number>;

		for (let i = 0; i < password.length; i++) {
			const currentChar = password[i];

			if (repeatingCharsHash[currentChar]) {
				repeatingCharsHash[currentChar]++;
				if (repeatingCharsHash[currentChar] === maxRepeatingChars) return false;
			} else {
				repeatingCharsHash[currentChar] = 1;
			}
		}

		return true;
	},
	'get-password-policy-mustContainAtLeastOneLowercase': (password: string) => /[a-z]/.test(password),
	'get-password-policy-mustContainAtLeastOneUppercase': (password: string) => /[A-Z]/.test(password),
	'get-password-policy-mustContainAtLeastOneNumber': (password: string) => /[0-9]/.test(password),
	'get-password-policy-mustContainAtLeastOneSpecialCharacter': (password: string) => /[^A-Za-z0-9\s]/.test(password),
};

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

	return useMemo(() => validator.sendValidationMessage(password), [password, validator]);
};
