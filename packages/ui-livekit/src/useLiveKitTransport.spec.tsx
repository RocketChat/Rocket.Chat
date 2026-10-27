import { videoConferenceInfoQueryKey } from '@rocket.chat/ui-video-conf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useLiveKitTransport } from './useLiveKitTransport';

const getCallConfig = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	useEndpoint: () => getCallConfig,
}));

const renderTransport = (connect: boolean) => {
	const queryClient = new QueryClient();
	const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	const view = renderHook(({ connect }) => useLiveKitTransport('call1', connect), { wrapper, initialProps: { connect } });
	return { ...view, queryClient };
};

beforeEach(() => {
	getCallConfig.mockReset();
	let n = 0;
	getCallConfig.mockImplementation(async () => ({ livekit: { serverUrl: 'wss://lk', token: `token-${++n}` } }));
});

// The conference is read again whenever anything about the call changes; the call's credentials must not be.
it('is not asked again when the conference is', async () => {
	const { result, queryClient } = renderTransport(true);
	await waitFor(() => expect(result.current.data?.token).toBe('token-1'));

	await act(() => queryClient.invalidateQueries({ queryKey: videoConferenceInfoQueryKey('call1') }));

	expect(getCallConfig).toHaveBeenCalledTimes(1);
	expect(result.current.data?.token).toBe('token-1');
});

it('mints fresh credentials for every join', async () => {
	const { result, rerender } = renderTransport(true);
	await waitFor(() => expect(result.current.data?.token).toBe('token-1'));

	rerender({ connect: false });
	rerender({ connect: true });

	await waitFor(() => expect(result.current.data?.token).toBe('token-2'));
	expect(getCallConfig).toHaveBeenCalledTimes(2);
});

it('asks nothing before the join', () => {
	renderTransport(false);

	expect(getCallConfig).not.toHaveBeenCalled();
});
