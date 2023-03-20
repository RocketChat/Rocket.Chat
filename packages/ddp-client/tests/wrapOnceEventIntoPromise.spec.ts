import { Emitter } from '@rocket.chat/emitter';

// ClassMinimalDDPClient
import { wrapOnceEventIntoPromise } from '../src/wrapOnceEventIntoPromise';

describe('wrapOnceEventIntoPromise', () => {
	it('should resolve', async () => {
		const emitter = new Emitter();
		const promise = wrapOnceEventIntoPromise(emitter, 'test');

		emitter.emit('test', 'test');

		const result = await promise;

		expect(result).toBe('test');
	});
	it('should reject', async () => {
		const emitter = new Emitter();
		const promise = wrapOnceEventIntoPromise(emitter, 'test');

		emitter.emit('test', { error: 'test' });

		await expect(promise).rejects.toBe('test');

		expect.assertions(1);
	});
});
