import type { UserInteraction } from '@rocket.chat/ui-kit';
import WS from 'jest-websocket-mock';

import { handleConnection } from './helpers';
import { LivechatClientImpl } from '../src/livechat/LivechatClientImpl';

let server: WS;

const interaction: UserInteraction = {
	type: 'blockAction',
	actionId: 'action-id',
	payload: { blockId: 'block-id', value: 'value' },
	container: { type: 'view', id: 'view-id' },
	triggerId: 'trigger-id',
};

beforeEach(() => {
	server = new WS('ws://localhost:1234/websocket');
});

afterEach(() => {
	server.close();
	WS.clean();
	jest.useRealTimers();
});

it('should keep reconnecting past three failed attempts and connect once the server is back', async () => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');
	await handleConnection(server, livechat.connection.connect());

	jest.useFakeTimers();

	server.close();
	WS.clean();

	await jest.advanceTimersByTimeAsync(120_000);
	expect(livechat.connection.retryCount).toBeGreaterThan(3);
	expect(livechat.connection.status).toBe('disconnected');

	server = new WS('ws://localhost:1234/websocket');

	await handleConnection(
		server,
		jest.advanceTimersByTimeAsync(60_000),
		new Promise((resolve) => livechat.connection.once('connected', resolve)),
	);

	expect(livechat.connection.status).toBe('connected');
	livechat.connection.close();
});

it('should use the token set through credentials', () => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');

	livechat.credentials.token = 'visitor-token';

	expect(livechat.token).toBe('visitor-token');
	expect(livechat.credentials.token).toBe('visitor-token');
});

it.each([
	['closeChat', (livechat: LivechatClientImpl) => livechat.closeChat({ rid: 'rid' })],
	['room', (livechat: LivechatClientImpl) => livechat.room({ token: '' })],
	['sendMessage', (livechat: LivechatClientImpl) => livechat.sendMessage({ token: '', rid: 'rid', msg: 'hello' })],
	['uploadFile', (livechat: LivechatClientImpl) => livechat.uploadFile('rid', new File(['x'], 'x.txt'))],
	['sendUiInteraction', (livechat: LivechatClientImpl) => livechat.sendUiInteraction(interaction, 'app-id')],
])('should reject %s instead of throwing when there is no visitor token', async (_, request) => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');

	let promise: Promise<unknown> | undefined;
	expect(() => {
		promise = request(livechat);
	}).not.toThrow();
	await expect(promise).rejects.toThrow('Invalid token');
});

it('should send the visitor token when listening to the queue position', async () => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');
	await handleConnection(server, livechat.connection.connect());
	livechat.token = 'visitor-token';

	livechat.onQueuePositionChange('rid', () => undefined);

	await expect(server.nextMessage.then((message) => JSON.parse(message as string))).resolves.toMatchObject({
		msg: 'sub',
		name: 'stream-livechat-room',
		params: ['rid', { useCollection: false, args: [{ token: 'visitor-token', visitorToken: 'visitor-token' }] }],
	});
	livechat.connection.close();
});

it('should stop every active subscription when unsubscribing all', async () => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');
	await handleConnection(server, livechat.connection.connect());
	livechat.token = 'visitor-token';

	livechat.onRoomMessage('rid', () => undefined);
	livechat.onQueuePositionChange('rid', () => undefined);
	const nextMessage = async () => JSON.parse((await server.nextMessage) as string);
	const subscriptionIds = [(await nextMessage()).id, (await nextMessage()).id];

	const unsubscribed = livechat.unsubscribeAll();
	const unsubscribes = [await nextMessage(), await nextMessage()];
	subscriptionIds.forEach((id) => server.send(JSON.stringify({ msg: 'nosub', id })));

	await expect(unsubscribed).resolves.toHaveLength(2);
	expect(unsubscribes).toEqual(subscriptionIds.map((id) => ({ msg: 'unsub', id })));
	livechat.connection.close();
});

describe('sendUiInteraction', () => {
	it('should send the visitor token header with the interaction', async () => {
		const livechat = LivechatClientImpl.create('ws://localhost:1234');
		livechat.token = 'visitor-token';
		const post = jest.spyOn(livechat.rest, 'post').mockResolvedValue(null);

		await livechat.sendUiInteraction(interaction, 'app-id');

		expect(post).toHaveBeenCalledWith('/apps/ui.interaction/app-id', interaction, { headers: { 'x-visitor-token': 'visitor-token' } });
	});

	it('should send no request when the app id could change the path', async () => {
		const livechat = LivechatClientImpl.create('ws://localhost:1234');
		livechat.token = 'visitor-token';
		const post = jest.spyOn(livechat.rest, 'post');

		await expect(livechat.sendUiInteraction(interaction, '../users')).rejects.toThrow('Invalid app id');

		expect(post).not.toHaveBeenCalled();
	});
});
