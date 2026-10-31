import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useRoomInfoEndpoint } from './useRoomInfoEndpoint';

const forbidden = { success: false, error: 'You are not allowed to do this', errorType: 'error-forbidden' };
const badRequest = { success: false, error: 'Room not found', errorType: 'error-room-not-found' };

const renderRoomInfo = (error: unknown) => {
	const endpoint = jest.fn(async () => {
		throw error;
	});

	const { result } = renderHook(() => useRoomInfoEndpoint('rid'), {
		wrapper: mockAppRoot().withJohnDoe().withEndpoint('GET', '/v1/rooms.info', endpoint).build(),
	});

	return { endpoint, result };
};

describe('useRoomInfoEndpoint', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should not retry a 403 refusal', async () => {
		const { endpoint, result } = renderRoomInfo(forbidden);

		await waitFor(() => expect(result.current.isError).toBe(true));
		await act(() => jest.advanceTimersByTimeAsync(60_000));

		expect(endpoint).toHaveBeenCalledTimes(1);
	});

	it('should retry any other error', async () => {
		const { endpoint, result } = renderRoomInfo(badRequest);

		await act(() => jest.advanceTimersByTimeAsync(60_000));

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(endpoint.mock.calls.length).toBeGreaterThan(1);
	});
});
