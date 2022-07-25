import { expect, spy } from 'chai';
import mock from 'mock-require';

import { InMemoryQueue } from '../../../../../../../../app/federation-v2/server/infrastructure/queue/InMemoryQueue';

mock('fastq', {
	promise: (handler: Function) => ({
		push: async (task: any): Promise<void> => handler(task),
	}),
});

describe('Federation - Infrastructure - Queue - InMemoryQueue', () => {
	const queue = new InMemoryQueue();

	describe('#addToQueue()', () => {
		it('should throw an error if the instance was not set beforehand', () => {
			expect(() => queue.addToQueue({})).to.throw('You need to set the handler first');
		});

		it('should push the task to the queue instance to be handled when the instance was properly defined', () => {
			const spiedCb = spy(() => Promise.resolve());
			const concurrency = 1;
			queue.setHandler(spiedCb, concurrency);
			queue.addToQueue({ task: 'my-task' });
			expect(spiedCb).to.have.been.called.with({ task: 'my-task' });
		});
	});
});
