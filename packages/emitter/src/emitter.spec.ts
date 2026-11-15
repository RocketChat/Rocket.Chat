import { Emitter } from './index';

const times = (n: number, fn: () => void): number => {
	Array.from({ length: n }, () => fn());
	return n;
};

let handler: () => void;
let emitter: Emitter;

beforeEach(() => {
	handler = jest.fn();
	emitter = new Emitter();
});

describe('`on` method', () => {
	it('should call `test` handler 5 times - with only one listener', () => {
		emitter.on('test', handler);
		times(5, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(5);
	});

	it('should call `test2` handler 0 times - with multiple listeners', () => {
		emitter.on('test', () => null);
		emitter.on('test2', handler);
		times(5, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(0);
	});
});

describe('`once` method', () => {
	it('should call `test` handler only once', () => {
		emitter.once('test', handler);
		times(5, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('should call `test` handler only once - with multiple events and same handler', () => {
		emitter.once('test', handler);
		emitter.once('test2', handler);
		times(5, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('should call `test` handler 5 times afert `once + remove + on` same event', () => {
		emitter.once('test', handler);
		emitter.off('test', handler);
		emitter.on('test', handler);
		times(5, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(5);
	});

	it('should call `test` handler once after add multiple `once` and remove n-1', () => {
		emitter.once('test', handler);
		emitter.once('test', handler)();
		emitter.once('test', handler)();
		emitter.once('test', handler)();
		emitter.once('test', handler)();
		emitter.once('test', handler)();
		times(5, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('should call `test` handler once after add same handler with different `once` events and remove n-1', () => {
		emitter.once('test', handler);
		emitter.once('test2', handler)();
		times(5, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('should call `test` handler only once when it re-emits the same event', () => {
		const reentrant = jest.fn(() => emitter.emit('test'));
		emitter.once('test', reentrant);
		emitter.emit('test');
		expect(reentrant).toHaveBeenCalledTimes(1);
		expect(emitter.has('test')).toBe(false);
	});

	it('should call `test` handler only once when an earlier handler re-emits the same event', () => {
		let reemitted = false;
		emitter.on('test', () => {
			if (!reemitted) {
				reemitted = true;
				emitter.emit('test');
			}
		});
		emitter.once('test', handler);
		emitter.emit('test');
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('should keep `once` and `on` registrations of the same handler on different events independent', () => {
		emitter.on('test', handler);
		emitter.once('test2', handler);
		times(2, () => emitter.emit('test'));
		times(2, () => emitter.emit('test2'));
		expect(handler).toHaveBeenCalledTimes(3);
		expect(emitter.has('test')).toBe(true);
		expect(emitter.has('test2')).toBe(false);
	});

	it('should keep `once` registration after removing an `on` registration of the same handler on another event', () => {
		emitter.on('test', handler);
		emitter.once('test2', handler);
		emitter.off('test', handler);
		times(2, () => emitter.emit('test2'));
		expect(handler).toHaveBeenCalledTimes(1);
		expect(emitter.has('test2')).toBe(false);
	});

	it('should remove `test` handler even if it throws', () => {
		const throwing = jest.fn(() => {
			throw new Error('boom');
		});
		emitter.once('test', throwing);
		expect(() => emitter.emit('test')).toThrow('boom');
		emitter.emit('test');
		expect(throwing).toHaveBeenCalledTimes(1);
		expect(emitter.has('test')).toBe(false);
	});
});

describe('`off` method', () => {
	it('should have no `test` handler after removal', () => {
		emitter.on('test', handler);
		emitter.off('test', handler);
		expect(emitter.has('test')).toBe(false);
	});

	it('should have no `test` handler after use stop callback', () => {
		emitter.on('test', handler)();
		expect(emitter.has('test')).toBe(false);
	});

	it('should remove only its own registration when using the stop callback', () => {
		emitter.on('test', handler);
		emitter.once('test', handler)();
		times(2, () => emitter.emit('test'));
		expect(handler).toHaveBeenCalledTimes(2);
		expect(emitter.has('test')).toBe(true);
	});

	it('should have no `test` handler after emit once', () => {
		emitter.once('test', handler);
		emitter.emit('test');
		expect(emitter.has('test')).toBe(false);
	});

	it('should remove only the specified handler', () => {
		const handler = jest.fn();
		const unusedHandler = jest.fn();

		emitter.on('test', handler);
		emitter.off('test', unusedHandler);

		emitter.emit('test');

		expect(handler).toHaveBeenCalledTimes(1);
		expect(unusedHandler).toHaveBeenCalledTimes(0);
	});
});
