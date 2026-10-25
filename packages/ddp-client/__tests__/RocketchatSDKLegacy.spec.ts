import WS from 'jest-websocket-mock';

import { handleConnection } from './helpers';
import { RocketchatSdkLegacyImpl } from '../src/legacy/RocketchatSDKLegacy';

let server: WS;

beforeEach(() => {
	server = new WS('ws://localhost:1234/websocket');
});

afterEach(() => {
	server.close();
	WS.clean();
	jest.useRealTimers();
});

const nextFrame = async () => JSON.parse((await server.nextMessage) as string);

it('should restore subscriptions after a reconnection', async () => {
	const sdk = RocketchatSdkLegacyImpl.create('ws://localhost:1234');
	await handleConnection(server, sdk.connection.connect());

	const subscription = sdk.client.subscribe('publication');
	await server.nextMessage;

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();
	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');
	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(server, jest.advanceTimersByTimeAsync(2000), connected);
	jest.useRealTimers();

	await expect(nextFrame()).resolves.toMatchObject({ msg: 'sub', id: subscription.id, name: 'publication' });
	sdk.connection.close();
});

it('should unsubscribe from every subscription', async () => {
	const sdk = RocketchatSdkLegacyImpl.create('ws://localhost:1234');
	await handleConnection(server, sdk.connection.connect());

	const first = sdk.client.subscribe('first');
	const second = sdk.client.subscribe('second');
	await server.nextMessage;
	await server.nextMessage;

	const unsubscribed = sdk.unsubscribeAll();

	await expect(nextFrame()).resolves.toEqual({ msg: 'unsub', id: first.id });
	await expect(nextFrame()).resolves.toEqual({ msg: 'unsub', id: second.id });
	server.send(JSON.stringify({ msg: 'nosub', id: first.id }));
	server.send(JSON.stringify({ msg: 'nosub', id: second.id }));

	await expect(unsubscribed).resolves.toEqual([
		{ msg: 'nosub', id: first.id },
		{ msg: 'nosub', id: second.id },
	]);
	expect(sdk.client.subscriptions.size).toBe(0);
	sdk.connection.close();
});
