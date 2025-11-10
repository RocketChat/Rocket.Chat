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
});
