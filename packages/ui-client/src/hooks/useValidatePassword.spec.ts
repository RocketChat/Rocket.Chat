import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react-hooks';

import { useValidatePassword } from './useValidatePassword';

type Response = {
	enabled: boolean;
	policy: [
		name: string,
		value?:
			| {
					[x: string]: number;
			  }
			| undefined,
	][];
};

it("should return `false` if password doesn't match all the requirements", async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 8 }]],
	};

	const { result, waitForValueToChange } = renderHook(async () => useValidatePassword('secret'), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitForValueToChange(() => result.current);
	const res = await result.current;
	expect(res).toBeFalsy();
});

it('should return `true` if password matches all the requirements', async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 8 }]],
	};

	const { result, waitForValueToChange } = renderHook(async () => useValidatePassword('secret-password'), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitForValueToChange(() => result.current);
	const res = await result.current;
	expect(res).toBeTruthy();
});

it('should return `undefined` if password validation is still loading', async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 8 }]],
	};

	const { result } = renderHook(async () => useValidatePassword('secret-password'), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	const res = await result.current;
	expect(res).toBeUndefined();
});
