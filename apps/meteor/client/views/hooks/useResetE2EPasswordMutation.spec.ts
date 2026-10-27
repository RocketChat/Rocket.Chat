import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useResetE2EPasswordMutation } from './useResetE2EPasswordMutation';

const mockWipe = jest.fn(async () => true);

jest.mock('../../lib/e2ee/rocketchat.e2e', () => ({
	e2eSearchIndexRuntime: { wipe: () => mockWipe() },
}));

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

// LSE2EE-86 / LSE2EE-87: the desktop app replaces the index of an old E2E key at the next open, so the key reset does not
// wipe the local search index. A cancelled reset keeps the index.
describe('useResetE2EPasswordMutation and the local search index', () => {
	it('keeps the local search index when the key reset is cancelled', async () => {
		const endpoint = jest.fn(async (): Promise<null> => {
			throw new Error('totp-canceled');
		});
		const { result, logout } = renderReset(endpoint);

		act(() => result.current.mutate());

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(endpoint).toHaveBeenCalledTimes(1);
		expect(mockWipe).not.toHaveBeenCalled();
		expect(logout).not.toHaveBeenCalled();
	});

	it('does not wipe the local search index around a key reset', async () => {
		const endpoint = jest.fn(async () => null);
		const { result, logout } = renderReset(endpoint);

		act(() => result.current.mutate());

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(endpoint).toHaveBeenCalledTimes(1);
		expect(mockWipe).not.toHaveBeenCalled();
		await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
	});
});
