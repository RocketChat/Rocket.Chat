import { GraphNotificationProcessor, validateGraphHandshake } from './webhook';

describe('Graph notifications', () => {
	it('validates client state, deduplicates, and coalesces per subscription', async () => {
		const claimed = new Set<string>();
		const deduplication = { claim: jest.fn(async (key: string) => (claimed.has(key) ? false : (claimed.add(key), true))) };
		const queue = { enqueueSubscription: jest.fn().mockResolvedValue(undefined) };
		const processor = new GraphNotificationProcessor('expected-secret', deduplication, queue);
		const notification = { subscriptionId: 'sub1', clientState: 'expected-secret', resource: 'users/x/events/1', changeType: 'updated' };
		const result = await processor.process([notification, notification, { ...notification, clientState: 'wrong' }]);
		expect(result).toEqual({ accepted: 1, rejected: 1, enqueued: 1 });
		expect(queue.enqueueSubscription).toHaveBeenCalledTimes(1);
		expect(queue.enqueueSubscription).toHaveBeenCalledWith('sub1', 'change');
	});

	it('turns lifecycle missed notifications into reconciliation work', async () => {
		const queue = { enqueueSubscription: jest.fn().mockResolvedValue(undefined) };
		const processor = new GraphNotificationProcessor('secret', { claim: async () => true }, queue);
		await processor.process([{ subscriptionId: 'sub1', clientState: 'secret', lifecycleEvent: 'missed' }]);
		expect(queue.enqueueSubscription).toHaveBeenCalledWith('sub1', 'missed');
	});

	it('returns only safe validation tokens', () => {
		expect(validateGraphHandshake('opaque token')).toBe('opaque token');
		expect(validateGraphHandshake('bad\r\nheader')).toBeNull();
		expect(validateGraphHandshake('x'.repeat(256))).toBeNull();
	});
});
