import { MinimalDDPClient } from '../src/MinimalDDPClient';

describe('ping/pong mechanism', () => {
	it('should reply with pong if no id is provided', () => {
		const handlerCallback = jest.fn();
		const senderCallback = jest.fn();

		const client = new MinimalDDPClient(() => undefined);

		client.once('message', handlerCallback);
		client.once('send', senderCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ping',
			}),
		);

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'ping',
		});

		expect(senderCallback).toHaveBeenCalledTimes(1);
		expect(senderCallback).toHaveBeenCalledWith({
			msg: 'pong',
		});
	});

	it('should reply with pong if id is provided', () => {
		const handlerCallback = jest.fn();
		const senderCallback = jest.fn();

		const client = new MinimalDDPClient(() => undefined);

		client.on('message', handlerCallback);
		client.on('send', senderCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ping',
				id: '123',
			}),
		);

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'ping',
			id: '123',
		});

		expect(senderCallback).toHaveBeenCalledTimes(1);
		expect(senderCallback).toHaveBeenCalledWith({
			msg: 'pong',
			id: '123',
		});
	});

	it('should emit "pong" event if pong is received', () => {
		const handlerCallback = jest.fn();

		const client = new MinimalDDPClient(() => undefined);

		client.once('pong', handlerCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'pong',
			}),
		);

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'pong',
		});
	});
});

describe('subscription mechanism', () => {
	it('should emit "ready" event after subscribe', () => {
		const handlerCallback = jest.fn();

		const client = new MinimalDDPClient(() => undefined);

		const id = client.subscribe('test');

		client.onPublish(id, handlerCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [id],
			}),
		);

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'ready',
			subs: [id],
		});
	});

	it('should emit "nosub" event if something goes wrong', () => {
		const handlerCallback = jest.fn();

		const client = new MinimalDDPClient(() => undefined);

		const id = client.subscribe('test');

		client.onPublish(id, handlerCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'nosub',
				id,
			}),
		);

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'nosub',
			id,
		});
	});

	it('should emit "nosub" event after unsubscribe', () => {
		const handlerCallback = jest.fn();

		const nosubCallback = jest.fn();

		const client = new MinimalDDPClient();

		const id = client.subscribe('test');

		client.onPublish(id, handlerCallback);
		client.onNoSub(id, nosubCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [id],
			}),
		);

		client.unsubscribe(id);

		client.handleMessage(
			JSON.stringify({
				msg: 'nosub',
				id,
			}),
		);

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'ready',
			subs: [id],
		});

		expect(nosubCallback).toHaveBeenCalledTimes(1);
		expect(nosubCallback).toHaveBeenCalledWith({
			msg: 'nosub',
			id,
		});
	});
});

describe('subscription added/changed/removed mechanism', () => {
	it('should receive "added" events after subscribe', () => {
		const handlerCallback = jest.fn();
		const readyCallback = jest.fn();
		const client = new MinimalDDPClient(() => undefined);

		const id = client.subscribe('test');

		client.onCollection('test', handlerCallback);

		client.onPublish(id, readyCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [id],
			}),
		);

		client.handleMessage(
			JSON.stringify({
				msg: 'added',
				collection: 'test',
				id,
				fields: {
					test: 'test',
				},
			}),
		);

		expect(readyCallback).toHaveBeenCalledTimes(1);
		expect(readyCallback).toHaveBeenCalledWith({
			msg: 'ready',
			subs: [id],
		});

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'added',
			collection: 'test',
			id,
			fields: {
				test: 'test',
			},
		});
	});

	it('should receive "changed" events after subscribe', () => {
		const handlerCallback = jest.fn();
		const readyCallback = jest.fn();
		const client = new MinimalDDPClient(() => undefined);

		const id = client.subscribe('test');

		client.onCollection('test', handlerCallback);

		client.onPublish(id, readyCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [id],
			}),
		);

		client.handleMessage(
			JSON.stringify({
				msg: 'changed',
				collection: 'test',
				id,
				fields: {
					test: 'test',
				},
			}),
		);

		expect(readyCallback).toHaveBeenCalledTimes(1);
		expect(readyCallback).toHaveBeenCalledWith({
			msg: 'ready',
			subs: [id],
		});

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'changed',
			collection: 'test',
			id,
			fields: {
				test: 'test',
			},
		});
	});

	it('should receive "removed" events after subscribe', () => {
		const handlerCallback = jest.fn();
		const readyCallback = jest.fn();
		const client = new MinimalDDPClient(() => undefined);

		const id = client.subscribe('test');

		client.onCollection('test', handlerCallback);

		client.onPublish(id, readyCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [id],
			}),
		);

		client.handleMessage(
			JSON.stringify({
				msg: 'removed',
				collection: 'test',
				id,
			}),
		);

		expect(readyCallback).toHaveBeenCalledTimes(1);
		expect(readyCallback).toHaveBeenCalledWith({
			msg: 'ready',
			subs: [id],
		});

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'removed',
			collection: 'test',
			id,
		});
	});
});

describe('subscription updated mechanism', () => {
	it('should receive "updated" events after subscribe and before ready', () => {
		const handlerCallback = jest.fn();
		const readyCallback = jest.fn();
		const updatedCallback = jest.fn();
		const client = new MinimalDDPClient(() => undefined);

		const id = client.subscribe('test');

		client.onCollection(id, handlerCallback);
		client.onPublish(id, readyCallback);
		client.onUpdate(id, updatedCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [id],
			}),
		);

		client.handleMessage(
			JSON.stringify({
				msg: 'updated',
				methods: [id],
			}),
		);

		expect(readyCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledTimes(0);
		expect(updatedCallback).toHaveBeenCalledTimes(1);
		expect(updatedCallback).toHaveBeenCalledWith({
			msg: 'updated',
			methods: [id],
		});
	});
});

describe('method mechanism', () => {
	it('should emit "result" event after method call', () => {
		const handlerCallback = jest.fn();

		const client = new MinimalDDPClient(() => undefined);

		const { id } = client.call('test');

		client.onResult(id, handlerCallback);

		client.handleMessage(
			JSON.stringify({
				msg: 'result',
				params: [],
				id,
			}),
		);

		expect(handlerCallback).toHaveBeenCalledTimes(1);
		expect(handlerCallback).toHaveBeenCalledWith({
			msg: 'result',
			params: [],
			id,
		});
	});
});

describe('error mechanism', () => {
	it('should throw error if the payload is not valid', () => {
		const client = new MinimalDDPClient(() => undefined);

		expect(() => {
			client.handleMessage('test');
		}).toThrow();
	});
});
