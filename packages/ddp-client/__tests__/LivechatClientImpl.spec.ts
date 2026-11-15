import WS from 'jest-websocket-mock';

import { handleConnection } from './helpers';
import { LivechatClientImpl } from '../src/livechat/LivechatClientImpl';

let server: WS;

beforeEach(() => {
	server = new WS('ws://localhost:1234/websocket');
});

afterEach(() => {
	server.close();
	WS.clean();
});

it('should use the token set through credentials', () => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');

	livechat.credentials.token = 'visitor-token';

	expect(livechat.token).toBe('visitor-token');
	expect(livechat.credentials.token).toBe('visitor-token');
});

it('should reject instead of throwing when there is no visitor token', async () => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');

	let promise: Promise<unknown> | undefined;
	expect(() => {
		promise = livechat.closeChat({ rid: 'rid' });
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
