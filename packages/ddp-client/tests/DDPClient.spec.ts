import { ClassMinimalDDPClient } from '../src/ClassMinimalDDPClient';
import { DDPClientImpl } from '../src/DDPClient';

describe('DDPClient', () => {
	describe('call procedures', () => {
		it('should be able to call a method and receive a result', async () => {
			const callback = jest.fn();
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
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
		it('should be able to  handle errors thrown by the method call', async () => {
			const callback = jest.fn();
			const ws = new ClassMinimalDDPClient(() => undefined);

			const client = new DDPClientImpl(ws);
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
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
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
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
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
	});
	describe('subscribe procedures', () => {
		it('should be able to subscribe to a collection and receive a result', async () => {
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
			const promise = client.subscribe('test');
			ws.handleMessage(
				JSON.stringify({
					msg: 'ready',
					subs: [promise.id],
				}),
			);

			await expect(promise).resolves.toEqual({
				msg: 'ready',
				id: promise.id,
			});
		});
		it('should be able to subscribe to a collection and receive an error', async () => {
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
			const promise = client.subscribe('test');
			ws.handleMessage(
				JSON.stringify({
					msg: 'nosub',
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

		it('should be able to unsubscribe from a collection', async () => {
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
			const promise = client.subscribe('test');
			ws.handleMessage(
				JSON.stringify({
					msg: 'ready',
					subs: [promise.id],
				}),
			);
			await expect(promise).resolves.toEqual({
				msg: 'ready',
				id: promise.id,
			});
			const unsubPromise = client.unsubscribe(promise.id);

			ws.handleMessage(
				JSON.stringify({
					msg: 'nosub',
					id: promise.id,
				}),
			);

			expect(unsubPromise).resolves.toEqual({
				msg: 'nosub',
				id: promise.id,
			});
		});

		it('should subscribe to a collection and receive values through the observer', async () => {
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
			const promise = client.subscribe('test');

			ws.handleMessage(
				JSON.stringify({
					msg: 'ready',
					subs: [promise.id],
				}),
			);

			await expect(promise).resolves.toEqual({
				msg: 'ready',
				id: promise.id,
			});

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
			const ws = new ClassMinimalDDPClient(() => undefined);
			const client = new DDPClientImpl(ws);
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
});
