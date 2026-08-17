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
