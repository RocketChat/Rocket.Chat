import { renderHook } from '@testing-library/react';

import { usePasswordPolicy } from './usePasswordPolicy';

describe('usePasswordPolicy', () => {
	const options = { enabled: true, minLength: 5, throwError: false };

	it.each([null, undefined, 1, '', '   '])('should reject invalid passwords: %p', (password) => {
		const { result } = renderHook(() => usePasswordPolicy(options));

		expect(result.current(password as any)).toEqual({ validations: [], valid: false });
	});

	it('should accept a valid password', () => {
		const { result } = renderHook(() => usePasswordPolicy(options));

		expect(result.current('12345')).toEqual({
			validations: [{ name: 'get-password-policy-minLength', isValid: true, limit: 5 }],
			valid: true,
		});
	});
});
