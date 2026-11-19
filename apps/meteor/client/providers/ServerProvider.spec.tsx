import { useConnectionStatus, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { act, render, renderHook } from '@testing-library/react';

import ConnectionStatusProvider from './ConnectionStatusProvider';
import ServerProvider from './ServerProvider';
import { sdk } from '../lib/SDKClient';
import { getDdpSdk } from '../lib/sdk/ddpSdk';
import { type ConnectionStatus, getConnectionStatus } from '../meteor/connection';

jest.mock('../../rocketchat.info', () => ({ Info: {} }));

jest.mock('../meteor/connection', () => ({
	getConnectionStatus: jest.fn(() => ({ status: 'connected', connected: true, retryCount: 0 })),
	disconnect: jest.fn(),
	reconnect: jest.fn(),
}));

jest.mock('../lib/sdk/ddpSdk', () => {
	const connection = { on: jest.fn(() => () => undefined) };
	return {
		getDdpSdk: () => ({ connection }),
		ensureConnectedAndAuthenticated: jest.fn(),
	};
});

jest.mock('../lib/SDKClient', () => ({
	sdk: {
		call: jest.fn(),
		rest: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
		stream: jest.fn(() => ({
			stop: jest.fn(),
			ready: jest.fn(() => Promise.resolve()),
		})),
		onAnyStreamEvent: jest.fn(() => ({ stop: jest.fn() })),
		publish: jest.fn(),
	},
}));

const changeConnectionStatus = (next: ConnectionStatus) => {
	jest.mocked(getConnectionStatus).mockReturnValue(next);
	const connectionListeners = jest.mocked(getDdpSdk().connection.on).mock.calls.map(([, listener]) => listener);
	act(() => connectionListeners.forEach((listener) => listener()));
};

const outage: ConnectionStatus[] = [
	{ status: 'waiting', connected: false, retryCount: 1, retryTime: 1_000 },
	{ status: 'connecting', connected: false, retryCount: 1, retryTime: 1_000 },
	{ status: 'waiting', connected: false, retryCount: 2, retryTime: 3_000 },
	{ status: 'connected', connected: true, retryCount: 0 },
];

it('keeps server consumers still while the connection drops and recovers', () => {
	const endpointRenders = jest.fn();
	const streamRenders = jest.fn();
	const statusRenders = jest.fn();

	const EndpointConsumer = () => {
		useEndpoint('GET', '/v1/me');
		endpointRenders();
		return null;
	};

	const StreamConsumer = () => {
		useStream('notify-logged');
		streamRenders();
		return null;
	};

	const StatusConsumer = () => {
		const { status } = useConnectionStatus();
		statusRenders(status);
		return null;
	};

	render(
		<ServerProvider>
			<ConnectionStatusProvider>
				<EndpointConsumer />
				<StreamConsumer />
				<StatusConsumer />
			</ConnectionStatusProvider>
		</ServerProvider>,
	);

	outage.forEach(changeConnectionStatus);

	expect(statusRenders.mock.calls).toEqual([['connected'], ...outage.map(({ status }) => [status])]);
	expect(endpointRenders).toHaveBeenCalledTimes(1);
	expect(streamRenders).toHaveBeenCalledTimes(1);
});
it('calls onReady only after the server acknowledges the subscription', async () => {
	let acknowledge: () => void = () => undefined;
	const readyPromise = new Promise<void>((resolve) => {
		acknowledge = resolve;
	});
	const stop = jest.fn();
	const ready = jest.fn(() => readyPromise);

	jest.mocked(sdk.stream).mockReturnValueOnce({
		id: 'preview-subscription',
		name: 'stream-room-data',
		params: ['preview-room'],
		isReady: false,
		ready,
		stop,
		onChange: jest.fn(),
		onStop: jest.fn(() => () => undefined),
	});

	const onReady = jest.fn();
	const onError = jest.fn();
	const { result, unmount } = renderHook(() => useStream('room-data'), {
		wrapper: ServerProvider,
	});

	const unsubscribe = result.current('preview-room', jest.fn(), {
		onReady,
		onError,
	});

	expect(ready).toHaveBeenCalledTimes(1);
	expect(onReady).not.toHaveBeenCalled();
	expect(onError).not.toHaveBeenCalled();

	await act(async () => {
		acknowledge();
		await readyPromise;
	});

	expect(onReady).toHaveBeenCalledTimes(1);
	expect(onError).not.toHaveBeenCalled();

	unsubscribe();
	expect(stop).toHaveBeenCalledTimes(1);
	unmount();
});
it('calls onError when the server rejects the subscription', async () => {
	const error = new Error('Subscription denied');
	const stop = jest.fn();

	jest.mocked(sdk.stream).mockReturnValueOnce({
		id: 'denied-subscription',
		name: 'stream-room-data',
		params: ['preview-room'],
		isReady: false,
		ready: jest.fn(() => Promise.reject(error)),
		stop,
		onChange: jest.fn(),
		onStop: jest.fn(() => () => undefined),
	});

	const onReady = jest.fn();
	const onError = jest.fn();
	const { result, unmount } = renderHook(() => useStream('room-data'), {
		wrapper: ServerProvider,
	});

	const unsubscribe = result.current('preview-room', jest.fn(), {
		onReady,
		onError,
	});

	await act(async () => {
		await Promise.resolve();
	});

	expect(onReady).not.toHaveBeenCalled();
	expect(onError).toHaveBeenCalledTimes(1);
	expect(onError).toHaveBeenCalledWith(error);

	unsubscribe();
	expect(stop).toHaveBeenCalledTimes(1);
	unmount();
});
it.each(['ready', 'error'] as const)('ignores a late %s acknowledgement after unsubscribing', async (outcome) => {
	let acknowledge: () => void = () => undefined;
	let rejectSubscription: (error: unknown) => void = () => undefined;
	const readyPromise = new Promise<void>((resolve, reject) => {
		acknowledge = resolve;
		rejectSubscription = reject;
	});
	const stop = jest.fn();

	jest.mocked(sdk.stream).mockReturnValueOnce({
		id: 'stopped-subscription',
		name: 'stream-room-data',
		params: ['preview-room'],
		isReady: false,
		ready: jest.fn(() => readyPromise),
		stop,
		onChange: jest.fn(),
		onStop: jest.fn(() => () => undefined),
	});

	const onReady = jest.fn();
	const onError = jest.fn();
	const { result, unmount } = renderHook(() => useStream('room-data'), {
		wrapper: ServerProvider,
	});

	const unsubscribe = result.current('preview-room', jest.fn(), {
		onReady,
		onError,
	});

	unsubscribe();
	expect(stop).toHaveBeenCalledTimes(1);

	await act(async () => {
		if (outcome === 'ready') {
			acknowledge();
		} else {
			rejectSubscription(new Error('Subscription denied'));
		}
		await Promise.resolve();
	});

	expect(onReady).not.toHaveBeenCalled();
	expect(onError).not.toHaveBeenCalled();
	unmount();
});
it('reports a server stop after readiness and removes the stop listener on cleanup', async () => {
	let serverStop: (error: unknown) => void = () => undefined;
	const removeStopListener = jest.fn();
	const stop = jest.fn();

	jest.mocked(sdk.stream).mockReturnValueOnce({
		id: 'later-stopped-subscription',
		name: 'stream-room-data',
		params: ['preview-room'],
		isReady: true,
		ready: jest.fn(() => Promise.resolve()),
		stop,
		onChange: jest.fn(),
		onStop: jest.fn((listener: (error: unknown) => void) => {
			serverStop = listener;
			return removeStopListener;
		}),
	});

	const onReady = jest.fn();
	const onError = jest.fn();
	const { result, unmount } = renderHook(() => useStream('room-data'), {
		wrapper: ServerProvider,
	});

	const unsubscribe = result.current('preview-room', jest.fn(), {
		onReady,
		onError,
	});

	await act(async () => {
		await Promise.resolve();
	});

	expect(onReady).toHaveBeenCalledTimes(1);
	expect(onError).not.toHaveBeenCalled();

	const error = new Error('Subscription stopped by server');
	act(() => {
		serverStop(error);
	});

	expect(onError).toHaveBeenCalledTimes(1);
	expect(onError).toHaveBeenCalledWith(error);

	unsubscribe();
	expect(removeStopListener).toHaveBeenCalledTimes(1);
	expect(stop).toHaveBeenCalledTimes(1);
	unmount();
});
