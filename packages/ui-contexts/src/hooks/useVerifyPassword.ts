import PasswordPolicy from '@rocket.chat/account-utils';
import { useCallback, useMemo } from 'react';

import { useSetting } from './useSetting';

const passwordVerificationsTemplate: Record<string, (password: string, lengthCriteria?: number) => boolean> = {
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
type PasswordPolicies = [key: string, value?: Record<string, number>][];

export const useVerifyPasswordByPolices = (policies?: PasswordPolicies) => {
	return useCallback(
		(password: string): PasswordVerifications => {
			if (!policies) {
				return [];
			}
			return policies
				.map(([name, rules]) => {
					if (name === 'get-password-policy-forbidRepeatingCharacters') return;

					const limit = rules && Object.values(rules)[0];

					return {
						name,
						isValid: password.length !== 0 && passwordVerificationsTemplate[name](password, limit),
						...(limit && { limit }),
					};
				})
				.filter(Boolean) as PasswordVerifications;
		},
		[policies],
	);
};

export const useVerifyPassword = (password: string): PasswordVerifications => {
	const enabled = useSetting('Accounts_Password_Policy_Enabled');
	const minLength = useSetting('Accounts_Password_Policy_MinLength');
	const maxLength = useSetting('Accounts_Password_Policy_MaxLength');
	const forbidRepeatingCharacters = useSetting('Accounts_Password_Policy_ForbidRepeatingCharacters');
	const forbidRepeatingCharactersCount = useSetting('Accounts_Password_Policy_ForbidRepeatingCharactersCount');
	const mustContainAtLeastOneLowercase = useSetting('Accounts_Password_Policy_AtLeastOneLowercase');
	const mustContainAtLeastOneUppercase = useSetting('Accounts_Password_Policy_AtLeastOneUppercase');
	const mustContainAtLeastOneNumber = useSetting('Accounts_Password_Policy_AtLeastOneNumber');
	const mustContainAtLeastOneSpecialCharacter = useSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter');

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

	return useMemo(() => validator.validate(password), [password, validator]);
};
