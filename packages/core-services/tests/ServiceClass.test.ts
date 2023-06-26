/* eslint-disable @typescript-eslint/no-empty-function */
import { ServiceClass } from '../src/types/ServiceClass';

describe('ServiceClass', () => {
	describe('#onEvent()', () => {
		it('should add one event to the internal event emitter instance', () => {
			const instance = new (class extends ServiceClass {
				protected name = 'test';
			})();

			instance.onEvent('test' as any, () => {});

			expect(instance.getEvents()).toHaveLength(1);
			expect(instance.getEvents()[0].eventName).toBe('test');
		});
	});
	describe('#getEvents()', () => {
		it('should return an array of events with all of their listeners', () => {
			const instance = new (class extends ServiceClass {
				protected name = 'test';
			})();
			const listener1 = () => {};
			const listener2 = () => {};
			const listener3 = () => {};
			const listeners = [listener1, listener2, listener3];

			instance.onEvent('test' as any, listener1);
			instance.onEvent('test' as any, listener2);
			instance.onEvent('test' as any, listener3);

			expect(instance.getEvents()).toHaveLength(1);
			expect(instance.getEvents()[0].listeners).toEqual(listeners);
		});
	});

	describe('#removeAllListeners()', () => {
		it('should remove all listeners', () => {
			const instance = new (class extends ServiceClass {
				protected name = 'test';
			})();
			const listener1 = () => {};
			const listener2 = () => {};
			const listener3 = () => {};

			instance.onEvent('test' as any, listener1);
			instance.onEvent('test' as any, listener2);
			instance.onEvent('test' as any, listener3);

			expect(instance.getEvents()).toHaveLength(1);
			instance.removeAllListeners();
			expect(instance.getEvents()).toHaveLength(0);
		});

		it('should not be possible to receive any event after remove them all', () => {
			const instance = new (class extends ServiceClass {
				protected name = 'test';
			})();
			const listener1 = jest.fn();

			instance.onEvent('test' as any, listener1);
			instance.emit('test' as any, 'test');
			instance.removeAllListeners();
			instance.emit('test' as any, 'test');

			expect(listener1).toHaveBeenCalledTimes(1);
		});
	});
});
