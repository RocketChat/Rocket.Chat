import { afterEach, beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import proxyquire from 'proxyquire';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const e2eeMock = {
	e2e: {
		getInstanceByRoomId: fn<FunctionLike>(),
	},
};

const { e2e } = e2eeMock as unknown as typeof import('../../../lib/e2ee');

const { useE2EEResetRoomKey } = proxyquire.noCallThru().load<typeof import('./useE2EEResetRoomKey')>('./useE2EEResetRoomKey', {
	'../../../lib/e2ee': e2eeMock,
});

describe('useE2EEResetRoomKey', () => {
	const e2eResetRoomKeyMock = fn<FunctionLike>().mockResolvedValue({
		e2eKeyId: 'E2E_KEY_ID',
		e2eKey: 'E2E_KEY',
	});
	const resetRoomKeyMock = fn<FunctionLike>();
	const roomId = 'ROOM_ID';

	afterEach(() => {
		mocker.clearAllMocks();
	});

	beforeEach(() => {
		(e2e.getInstanceByRoomId as Mock<FunctionLike>).mockImplementation(() => ({
			resetRoomKey: e2eResetRoomKeyMock,
		}));
	});

	it('should call resetRoomKey endpoint with correct params', async () => {
		const { result } = renderHook(() => useE2EEResetRoomKey(), {
			wrapper: mockAppRoot().withEndpoint('POST', '/v1/e2e.resetRoomKey', resetRoomKeyMock).build(),
		});

		await waitFor(() => result.current.mutate({ roomId }));

		expect(e2e.getInstanceByRoomId).toHaveBeenCalledTimes(1);
		expect(e2e.getInstanceByRoomId).toHaveBeenCalledWith('ROOM_ID');
		expect(e2eResetRoomKeyMock).toHaveBeenCalledTimes(1);

		expect(resetRoomKeyMock).toHaveBeenCalledWith({
			rid: roomId,
			e2eKeyId: 'E2E_KEY_ID',
			e2eKey: 'E2E_KEY',
		});

		await waitFor(() => expect(result.current.status).toBe('success'));
	});

	it('should return an errror if e2e.getInstanceByRoomId() does not return correct params', async () => {
		(e2e.getInstanceByRoomId as Mock<FunctionLike>).mockReturnValue(null);

		const { result } = renderHook(() => useE2EEResetRoomKey(), {
			wrapper: mockAppRoot().withEndpoint('POST', '/v1/e2e.resetRoomKey', resetRoomKeyMock).build(),
		});

		await waitFor(() => result.current.mutate({ roomId }));

		expect(e2e.getInstanceByRoomId).toHaveBeenCalledTimes(1);
		expect(e2e.getInstanceByRoomId).toHaveBeenCalledWith('ROOM_ID');
		expect(e2eResetRoomKeyMock).toHaveBeenCalledTimes(0);

		await waitFor(() => expect(result.current.status).toBe('error'));
	});

	it('should return an errror if e2e.resetRoomKey() does not return correct params', async () => {
		const e2eResetRoomKeyMock = fn<FunctionLike>().mockResolvedValue(null);
		const roomId = 'ROOM_ID';

		(e2e.getInstanceByRoomId as Mock<FunctionLike>).mockImplementation(() => ({
			resetRoomKey: e2eResetRoomKeyMock,
		}));

		const { result } = renderHook(() => useE2EEResetRoomKey(), {
			wrapper: mockAppRoot().withEndpoint('POST', '/v1/e2e.resetRoomKey', resetRoomKeyMock).build(),
		});

		await waitFor(() => result.current.mutate({ roomId }));

		expect(e2e.getInstanceByRoomId).toHaveBeenCalledTimes(1);
		expect(e2e.getInstanceByRoomId).toHaveBeenCalledWith('ROOM_ID');
		expect(e2eResetRoomKeyMock).toHaveBeenCalledTimes(1);

		expect(resetRoomKeyMock).toHaveBeenCalledTimes(0);

		await waitFor(() => expect(result.current.status).toBe('error'));
	});

	it('should return an error if resetRoomKey does not resolve', async () => {
		resetRoomKeyMock.mockRejectedValue(new Error('error-e2e-key-reset-in-progress'));
		const { result } = renderHook(() => useE2EEResetRoomKey(), {
			wrapper: mockAppRoot().withEndpoint('POST', '/v1/e2e.resetRoomKey', resetRoomKeyMock).build(),
		});

		await waitFor(() => result.current.mutate({ roomId }));

		expect(e2e.getInstanceByRoomId).toHaveBeenCalledTimes(1);
		expect(e2e.getInstanceByRoomId).toHaveBeenCalledWith('ROOM_ID');
		expect(e2eResetRoomKeyMock).toHaveBeenCalledTimes(1);

		expect(resetRoomKeyMock).toHaveBeenCalledWith({
			rid: roomId,
			e2eKeyId: 'E2E_KEY_ID',
			e2eKey: 'E2E_KEY',
		});

		await waitFor(() => expect(result.current.status).toBe('error'));
	});
});
