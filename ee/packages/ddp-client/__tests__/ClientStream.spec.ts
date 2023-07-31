import { ClientStreamImpl } from '../src/ClientStream';
import { DDPDispatcher } from '../src/DDPDispatcher';
import { MinimalDDPClient } from '../src/MinimalDDPClient';

describe('call procedures', () => {
	it('should be able to call a method and receive a result', async () => {
		const callback = jest.fn();
		const ws = new DDPDispatcher();
		const client = new ClientStreamImpl(ws);

		const id = client.call('test', callback);

		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: ['arg1', 'arg2'],
				id,
			}),
		);
		expect(callback).toBeCalledTimes(1);
		expect(callback).toBeCalledWith(null, ['arg1', 'arg2']);
	});

	it('should be able to handle errors thrown by the method call', async () => {
		const callback = jest.fn();
		const ws = new MinimalDDPClient(() => undefined);

		const client = new ClientStreamImpl(ws);
		const id = client.call('test', callback);
		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				error: {
					error: 400,
					reason: 'Bad Request',
					message: 'Bad Request [400]',
					errorType: 'Meteor.Error',
				},
				id,
			}),
		);
		expect(callback).toBeCalledTimes(1);
		expect(callback).toBeCalledWith({
			error: 400,
			reason: 'Bad Request',
			message: 'Bad Request [400]',
			errorType: 'Meteor.Error',
		});
	});

	it('should be able to callAsync a method and receive a result', async () => {
		const ws = new MinimalDDPClient(() => undefined);
		const client = new ClientStreamImpl(ws);
		const promise = client.callAsync('test');
		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: ['arg1', 'arg2'],
				id: promise.id,
			}),
		);

		const result = await promise;
		expect(result).toEqual(['arg1', 'arg2']);
	});

	it('should be able to callAsync a method and receive an error', async () => {
		const ws = new MinimalDDPClient(() => undefined);
		const client = new ClientStreamImpl(ws);
		const promise = client.callAsync('test');
		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				error: {
					error: 400,
					reason: 'Bad Request',
					message: 'Bad Request [400]',
					errorType: 'Meteor.Error',
				},
				id: promise.id,
			}),
		);

		await expect(promise).rejects.toEqual({
			error: 400,
			reason: 'Bad Request',
			message: 'Bad Request [400]',
			errorType: 'Meteor.Error',
		});
	});

	it('should only call the further methods after the previous one has been resolved respecting the wait option', async () => {
		const fn = jest.fn();
		const dispatch = jest.fn();

		const ws = new DDPDispatcher();
		const client = new ClientStreamImpl(ws);

		client.dispatcher.on('send', dispatch);

		const call = client.callWithOptions('wait 1', { wait: true }, fn);

		expect(client.dispatcher.queue.length).toBe(1);

		const callNoWait = client.call('no wait', fn);

		expect(client.dispatcher.queue.length).toBe(2);

		const call2 = client.callWithOptions('wait 2', { wait: true }, fn);

		expect(client.dispatcher.queue.length).toBe(3);

		expect(dispatch).toBeCalledTimes(1);

		expect(fn).toBeCalledTimes(0);

		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: ['arg1', 'arg2'],
				id: call,
			}),
		);

		expect(dispatch).toBeCalledTimes(3);
		expect(fn).toBeCalledTimes(1);

		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: ['arg1', 'arg2'],
				id: call2,
			}),
		);

		expect(fn).toBeCalledTimes(2);

		ws.handleMessage(
			JSON.stringify({
				msg: 'result',
				result: ['arg1', 'arg2'],
				id: callNoWait,
			}),
		);

		expect(fn).toBeCalledTimes(3);
	});
});

describe('subscribe procedures', () => {
	it('should be able to subscribe to a collection and receive a result', async () => {
		const ws = new MinimalDDPClient(() => undefined);
		const client = new ClientStreamImpl(ws);
		const subscription = client.subscribe('test');
		ws.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [subscription.id],
			}),
		);

		await expect(subscription.ready()).resolves.toBeUndefined();
	});

	it('should be able to subscribe to a collection and receive an error', async () => {
		const ws = new MinimalDDPClient(() => undefined);
		const client = new ClientStreamImpl(ws);
		const subscription = client.subscribe('test');
		ws.handleMessage(
			JSON.stringify({
				msg: 'nosub',
				error: {
					error: 400,
					reason: 'Bad Request',
					message: 'Bad Request [400]',
					errorType: 'Meteor.Error',
				},
				id: subscription.id,
			}),
		);

		await expect(subscription.ready()).rejects.toEqual({
			error: 400,
			reason: 'Bad Request',
			message: 'Bad Request [400]',
			errorType: 'Meteor.Error',
		});
	});

	it('should be able to unsubscribe from a collection', async () => {
		const ws = new MinimalDDPClient(() => undefined);
		const client = new ClientStreamImpl(ws);
		const subscription = client.subscribe('test');
		ws.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [subscription.id],
			}),
		);
		await expect(subscription.ready()).resolves.toBeUndefined();
		const unsubPromise = client.unsubscribe(subscription.id);

		ws.handleMessage(
			JSON.stringify({
				msg: 'nosub',
				id: subscription.id,
			}),
		);

		expect(unsubPromise).resolves.toEqual({
			msg: 'nosub',
			id: subscription.id,
		});
	});

	it('should subscribe to a collection and receive values through the observer', async () => {
		const ws = new MinimalDDPClient(() => undefined);
		const client = new ClientStreamImpl(ws);
		const promise = client.subscribe('test');

		ws.handleMessage(
			JSON.stringify({
				msg: 'ready',
				subs: [promise.id],
			}),
		);

		await expect(promise.ready()).resolves.toBeUndefined();

		const observer = jest.fn();

		client.onCollection('test', observer);

		ws.handleMessage(
			JSON.stringify({
				msg: 'added',
				collection: 'test',
				id: '1',
				fields: {
					name: 'test',
				},
			}),
		);

		expect(observer).toBeCalledTimes(1);
		expect(observer).toBeCalledWith({
			msg: 'added',
			collection: 'test',
			id: '1',
			fields: {
				name: 'test',
			},
		});
	});
});

describe('connect procedure', () => {
	it('should be able to connect to a server', async () => {
		const ws = new MinimalDDPClient(() => undefined);
		const client = new ClientStreamImpl(ws);
		const promise = client.connect();

		ws.handleMessage(
			JSON.stringify({
				msg: 'connected',
				session: 'test',
			}),
		);

		await expect(promise).resolves.toEqual({
			msg: 'connected',
			session: 'test',
		});
	});
});
