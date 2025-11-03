import { PasswordPolicy, type PasswordPolicyOptions, type PasswordPolicyValidation } from '@rocket.chat/password-policies';
import { useMemo, useCallback } from 'react';

export type { PasswordPolicyValidation };

export type UsePasswordPolicyResult = {
	validations: PasswordPolicyValidation[];
	valid: boolean;
};

export type UsePasswordPolicyReturn = (password: string) => UsePasswordPolicyResult;

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
