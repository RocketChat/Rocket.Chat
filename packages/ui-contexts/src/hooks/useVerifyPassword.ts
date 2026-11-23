import { useMemo } from 'react';

import { usePasswordPolicy, type UsePasswordPolicyReturn } from './usePasswordPolicy.js';
import { usePasswordPolicyOptions } from './usePasswordPolicyOptions.js';

export const useVerifyPassword: UsePasswordPolicyReturn = (password) => {
	const options = usePasswordPolicyOptions();
	const validate = usePasswordPolicy(options);

	return useMemo(() => validate(password || ''), [password, validate]);
};
