import { useConnectionStatus, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { act, render } from '@testing-library/react';

import ConnectionStatusProvider from './ConnectionStatusProvider';
import ServerProvider from './ServerProvider';
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
		stream: jest.fn(() => ({ stop: jest.fn() })),
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
