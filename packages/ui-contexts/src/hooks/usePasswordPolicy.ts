import { PasswordPolicy, type PasswordPolicyOptions, type PasswordPolicyValidation } from '@rocket.chat/password-policies';
import { useMemo, useCallback } from 'react';

export type UsePasswordPolicyReturn = (password: string) => {
	validations: PasswordPolicyValidation[];
	valid: boolean;
};

export type UsePasswordPolicy = (options: PasswordPolicyOptions) => UsePasswordPolicyReturn;

export const usePasswordPolicy: UsePasswordPolicy = (options) => {
	const policy = useMemo(() => new PasswordPolicy(options), [options]);

	return useCallback(
		(password: string) => {
			const validations = policy.sendValidationMessage(password);
			return {
				validations,
				valid: validations.every(({ isValid }) => isValid),
			};
		},
		[policy],
	);
};
