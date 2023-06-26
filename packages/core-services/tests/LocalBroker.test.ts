import { ServiceClass } from '../src';
import { LocalBroker } from '../src/LocalBroker';

describe('LocalBroker', () => {
	describe('#createService()', () => {
		it('should call all the expected lifecycle hooks when creating a service', () => {
			const createdStub = jest.fn();
			const instance = new (class extends ServiceClass {
				protected name = 'test';

				async created() {
					createdStub();
				}
			})();

			const broker = new LocalBroker();
			broker.createService(instance);

			expect(createdStub).toBeCalled();
		});
	});

	describe('#destroyService()', () => {
		it('should call all the expected lifecycle hooks when destroying a service', () => {
			const removeAllListenersStub = jest.fn();
			const stoppedStub = jest.fn();
			const instance = new (class extends ServiceClass {
				protected name = 'test';

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

			expect(removeAllListenersStub).toBeCalled();
			expect(stoppedStub).toBeCalled();
		});
	});

	describe('#broadcast()', () => {
		it('should call all the ServiceClass instance registered events', () => {
			const instance = new (class extends ServiceClass {
				protected name = 'test';
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

			expect(testListener).toBeCalledWith('test');
			expect(testListener2).toBeCalledWith('test');
			expect(test2Listener).toBeCalledWith('test2');
		});

		it('should NOT call any instance event anymore after the service being destroyed', () => {
			const instance = new (class extends ServiceClass {
				protected name = 'test';
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

			expect(testListener).not.toBeCalled();
			expect(test2Listener).not.toBeCalled();
		});
	});
});
