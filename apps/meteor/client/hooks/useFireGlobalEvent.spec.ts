import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useFireGlobalEvent } from './useFireGlobalEvent';
import { fireGlobalEventBase } from '../lib/utils/fireGlobalEventBase';

jest.mock('../lib/utils/fireGlobalEventBase', () => ({
	fireGlobalEventBase: jest.fn(() => () => undefined),
}));

const fireGlobalMock = fireGlobalEventBase as jest.MockedFunction<typeof fireGlobalEventBase>;

describe('useFireGlobalEvent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should dispatch event only once if scope is defined', async () => {
		const scope = 'scope';
		const { result } = renderHook(({ scope }) => useFireGlobalEvent('room-opened', scope), {
			initialProps: { scope },

			wrapper: mockAppRoot()
				.withSetting('Iframe_Integration_send_enable', true)
				.withSetting('Iframe_Integration_send_target_origin', '')
				.build(),
		});
		result.current.mutate(null);

		await waitFor(() => expect(result.current.status).toBe('success'));

		expect(fireGlobalMock).toHaveBeenCalledTimes(1);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));

		expect(fireGlobalMock).toHaveBeenCalledTimes(1);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));

		expect(fireGlobalMock).toHaveBeenCalledTimes(1);
	});

	it('should dispatch event only once for each (eventName/scope)', async () => {
		const { result, rerender } = renderHook(({ scope }) => useFireGlobalEvent('room-opened', scope), {
			initialProps: { scope: 'scope' },
			wrapper: mockAppRoot()
				.withSetting('Iframe_Integration_send_enable', true)
				.withSetting('Iframe_Integration_send_target_origin', '')
				.build(),
		});
		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(1);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(1);

		rerender({ scope: 'another' });

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(2);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(2);
	});

	it('should dispatch event multiple times if scope is not defined', async () => {
		const { result } = renderHook(() => useFireGlobalEvent('room-opened'), {
			wrapper: mockAppRoot()
				.withSetting('Iframe_Integration_send_enable', true)
				.withSetting('Iframe_Integration_send_target_origin', '')
				.build(),
		});

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(1);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(2);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(3);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(4);
	});

	it('should pass required settings to postMessage', async () => {
		const { result } = renderHook(() => useFireGlobalEvent('room-opened'), {
			wrapper: mockAppRoot()
				.withSetting('Iframe_Integration_send_enable', true)
				.withSetting('Iframe_Integration_send_target_origin', 'origin')
				.build(),
		});

		const postMessage = jest.fn();

		fireGlobalMock.mockImplementation(() => postMessage);

		result.current.mutate(null);
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(fireGlobalMock).toHaveBeenCalledTimes(1);
		expect(postMessage).toHaveBeenCalledWith(true, 'origin');
	});
});
