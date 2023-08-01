import { useCallback } from 'react';

import { usePasswordPolicy } from './usePasswordPolicy';

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

type PasswordVerifications = Record<string, { isValid: boolean; limit?: number }>;
type PasswordPolicies = [key: string, value?: Record<string, number>][];

export const useVerifyPasswordByPolices = (policies: PasswordPolicies) => {
	return useCallback(
		(password: string) => {
			return policies.reduce((passwordVerifications, [name, rules]) => {
				if (name === 'get-password-policy-forbidRepeatingCharacters') return passwordVerifications;

				if (rules) {
					passwordVerifications[name] = {
						isValid: password.length < 0 || passwordVerificationsTemplate[name](password, Object.values(rules)[0]),
						limit: Object.values(rules)[0],
					};
					return passwordVerifications;
				}

				passwordVerifications[name] = {
					isValid: password.length < 0 || passwordVerificationsTemplate[name](password),
					limit: undefined,
				};

				return passwordVerifications;
			}, {} as PasswordVerifications);
		},
		[policies],
	);
};

export const useVerifyPassword = (password: string) => {
	const { data } = usePasswordPolicy();

	return useVerifyPasswordByPolices(data?.policy ?? [])(password);
};
