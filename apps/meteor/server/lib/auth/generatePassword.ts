import generator from 'generate-password';

import { passwordPolicy } from './passwordPolicy';

export const generatePassword = (): string => {
	const policies = passwordPolicy.getPasswordPolicy();

	const maxLength: number = (policies.policy.find(([key]) => key === 'get-password-policy-maxLength')?.[1]?.maxLength as number) || -1;
	const minLength: number = (policies.policy.find(([key]) => key === 'get-password-policy-minLength')?.[1]?.minLength as number) || -1;

	const length = Math.min(Math.max(minLength, 12), maxLength > 0 ? maxLength : Number.MAX_SAFE_INTEGER);

	if (policies.enabled) {
		for (let i = 0; i < 10; i++) {
			const password = generator.generate({
				length,
				...(policies.policy && { numbers: true }),
				...(policies.policy.some(([key]) => key === 'get-password-policy-mustContainAtLeastOneSpecialCharacter') && { symbols: true }),
				...(policies.policy.some(([key]) => key === 'get-password-policy-mustContainAtLeastOneLowercase') && { lowercase: true }),
				...(policies.policy.some(([key]) => key === 'get-password-policy-mustContainAtLeastOneUppercase') && { uppercase: true }),
				strict: true,
			});

			if (passwordPolicy.validate(password)) {
				return password;
			}
		}
	}

	return generator.generate({ length: 17 });
};
