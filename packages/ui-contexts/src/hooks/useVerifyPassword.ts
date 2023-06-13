import { usePasswordPolicy } from './usePasswordPolicy';

export const useVerifyPassword = (password?: string) => {
	const { data, isLoading } = usePasswordPolicy();

	if (isLoading) return;

	if (!data?.enabled || password === undefined) return;

	const handleRepeatingChars = (maxRepeatingChars?: number) => {
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
	};

	const passwordVerificationsTemplate: Record<string, (lengthCriteria?: number) => boolean> = {
		'get-password-policy-minLength': (minLength?: number) => Boolean(minLength && password.length >= minLength),
		'get-password-policy-maxLength': (maxLength?: number) => Boolean(maxLength && password.length <= maxLength),
		'get-password-policy-forbidRepeatingCharactersCount': handleRepeatingChars,
		'get-password-policy-mustContainAtLeastOneLowercase': () => /[a-z]/.test(password),
		'get-password-policy-mustContainAtLeastOneUppercase': () => /[A-Z]/.test(password),
		'get-password-policy-mustContainAtLeastOneNumber': () => /[0-9]/.test(password),
		'get-password-policy-mustContainAtLeastOneSpecialCharacter': () => /[^A-Za-z0-9\s]/.test(password),
	};

	const passwordVerifications = {} as Record<string, { isValid: boolean; limit?: number }>;

	data?.policy.forEach((currentPolicy) => {
		if (!Array.isArray(currentPolicy)) return;

		if (currentPolicy[0] === 'get-password-policy-forbidRepeatingCharacters') return;

		if (currentPolicy[1]) {
			passwordVerifications[currentPolicy[0]] = {
				isValid: passwordVerificationsTemplate[currentPolicy[0]](Object.values(currentPolicy[1])[0]),
				limit: Object.values(currentPolicy[1])[0],
			};
			return;
		}

		passwordVerifications[currentPolicy[0]] = {
			isValid: passwordVerificationsTemplate[currentPolicy[0]](),
			limit: undefined,
		};
	});

	return passwordVerifications;
};
