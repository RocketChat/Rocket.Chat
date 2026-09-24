import { ServiceClass } from '../src';
import { LocalBroker } from '../src/LocalBroker';

describe('LocalBroker', () => {
	describe('#createService()', () => {
		it('should call all the expected lifecycle hooks when creating a service', () => {
			const createdStub = jest.fn();
			const instance = new (class extends ServiceClass {
				name = 'test';

				async created() {
					createdStub();
				}
			})();

			const broker = new LocalBroker();
			broker.createService(instance);

			expect(createdStub).toHaveBeenCalled();
		});
	});

	describe('#call()', () => {
		const brokerWith = (instance: ServiceClass) => {
			const broker = new LocalBroker();
			broker.createService(instance);
			return broker;
		};

		it('should dispatch to the registered service method', async () => {
			const instance = new (class extends ServiceClass {
				name = 'test';

				async echo(value: unknown) {
					return { echoed: value };
				}
			})();

			await expect(brokerWith(instance).call('test.echo', ['hi'])).resolves.toEqual({ echoed: 'hi' });
		});

		it('should hand the arguments over by reference', async () => {
			const received: unknown[] = [];
			const instance = new (class extends ServiceClass {
				name = 'test';

				async take(value: unknown) {
					received.push(value);
				}
			})();

			// stands in for a cursor or a stream, which no serializer would survive
			const circular: Record<string, unknown> = {};
			circular.self = circular;

			await brokerWith(instance).call('test.take', [circular]);

			expect(received[0]).toBe(circular);
		});

		it('should resolve undefined for a service it does not run', async () => {
			const instance = new (class extends ServiceClass {
				name = 'test';
			})();

			await expect(brokerWith(instance).call('other.method', [])).resolves.toBeUndefined();
		});

		it('should not expose lifecycle hooks or event handlers as callable', async () => {
			const startedStub = jest.fn();
			const handlerStub = jest.fn();
			const instance = new (class extends ServiceClass {
				name = 'test';

				async started() {
					startedStub();
				}

				onUserCreated() {
					handlerStub();
				}
			})();

			const broker = brokerWith(instance);
			await broker.call('test.started', []);
			await broker.call('test.onUserCreated', []);

			expect(startedStub).not.toHaveBeenCalled();
			expect(handlerStub).not.toHaveBeenCalled();
		});
	});

	describe('#destroyService()', () => {
		it('should call all the expected lifecycle hooks when destroying a service', () => {
			const removeAllListenersStub = jest.fn();
			const stoppedStub = jest.fn();
			const instance = new (class extends ServiceClass {
				name = 'test';

				removeAllListeners() {
					removeAllListenersStub();
				}

				async stopped() {
					stoppedStub();
				}
			})();

			const broker = new LocalBroker();
			broker.createService(instance);
			broker.destroyService(instance);

			expect(removeAllListenersStub).toHaveBeenCalled();
			expect(stoppedStub).toHaveBeenCalled();
		});
	});

	describe('#broadcast()', () => {
		it('should call all the ServiceClass instance registered events', () => {
			const instance = new (class extends ServiceClass {
				name = 'test';
			})();
			const testListener = jest.fn();
			const testListener2 = jest.fn();
			const test2Listener = jest.fn();
			instance.onEvent('test' as any, testListener);
			instance.onEvent('test' as any, testListener2);
			instance.onEvent('test2' as any, test2Listener);

			const broker = new LocalBroker();
			broker.createService(instance);
			broker.broadcast('test' as any, 'test');
			broker.broadcast('test2' as any, 'test2');

			expect(testListener).toHaveBeenCalledWith('test');
			expect(testListener2).toHaveBeenCalledWith('test');
			expect(test2Listener).toHaveBeenCalledWith('test2');
		});

		it('should NOT call any instance event anymore after the service being destroyed', () => {
			const instance = new (class extends ServiceClass {
				name = 'test';
			})();
			const testListener = jest.fn();
			const test2Listener = jest.fn();
			instance.onEvent('test' as any, testListener);
			instance.onEvent('test2' as any, test2Listener);

			const broker = new LocalBroker();
			broker.createService(instance);
			broker.destroyService(instance);

			broker.broadcast('test' as any, 'test');
			broker.broadcast('test2' as any, 'test2');

			expect(testListener).not.toHaveBeenCalled();
			expect(test2Listener).not.toHaveBeenCalled();
		});
	});

	describe('#setClusterTransport()', () => {
		const brokerWithTransport = () => {
			const publish = jest.fn();
			const broker = new LocalBroker();
			broker.setClusterTransport({ publish });
			return { broker, publish };
		};

		it('should hand every broadcast to the transport with its arguments', async () => {
			const { broker, publish } = brokerWithTransport();

			await broker.broadcast('test' as any, 'a', 1);

			expect(publish).toHaveBeenCalledTimes(1);
			expect(publish).toHaveBeenCalledWith('test', ['a', 1]);
		});

		it('should still deliver the broadcast to local listeners', async () => {
			const listener = jest.fn();
			const instance = new (class extends ServiceClass {
				name = 'test';
			})();
			instance.onEvent('test' as any, listener);

			const { broker } = brokerWithTransport();
			broker.createService(instance);
			await broker.broadcast('test' as any, 'a');

			expect(listener).toHaveBeenCalledWith('a');
		});

		it('should not hand broadcastLocal or broadcastToServices to the transport', async () => {
			const { broker, publish } = brokerWithTransport();

			await broker.broadcastLocal('test' as any, 'a');
			await broker.broadcastToServices(['test'], 'test' as any, 'a');

			expect(publish).not.toHaveBeenCalled();
		});

		it('should stop handing broadcasts over once the transport is removed', async () => {
			const { broker, publish } = brokerWithTransport();

			broker.setClusterTransport(undefined);
			await broker.broadcast('test' as any, 'a');

			expect(publish).not.toHaveBeenCalled();
		});
	});
});
