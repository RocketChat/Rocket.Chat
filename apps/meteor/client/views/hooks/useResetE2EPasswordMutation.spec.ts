import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useResetE2EPasswordMutation } from './useResetE2EPasswordMutation';

afterEach(() => {
	jest.clearAllMocks();
});

const renderReset = (endpoint: () => Promise<null>) => {
	const logout = jest.fn(async () => undefined);
	const { result } = renderHook(() => useResetE2EPasswordMutation(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('POST', '/v1/users.resetE2EKey', endpoint)
			.withLogout(logout)
			.withToastMessageDispatch(jest.fn())
			.build(),
	});
	return { result, logout };
};

// The key reset does not touch the local search index: the desktop app replaces the index of an old E2E key at the
// next open. These specs cover what the hook does: the reset call and the logout after it.
describe('useResetE2EPasswordMutation', () => {
	it('does not log out when the key reset is cancelled', async () => {
		const endpoint = jest.fn(async (): Promise<null> => {
			throw new Error('totp-canceled');
		});
		const { result, logout } = renderReset(endpoint);

		act(() => result.current.mutate());

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(endpoint).toHaveBeenCalledTimes(1);
		expect(logout).not.toHaveBeenCalled();
	});

	it('logs out after the key reset', async () => {
		const endpoint = jest.fn(async () => null);
		const { result, logout } = renderReset(endpoint);

		act(() => result.current.mutate());

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(endpoint).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
	});
});
