import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import type fastq from 'fastq';

const { InMemoryQueue } = proxyquire
	.noCallThru()
	.load('../../../../../../../../app/federation-v2/server/infrastructure/queue/InMemoryQueue', {
		fastq: {
			promise<C, T = any, R = any>(this: C, handler: fastq.asyncWorker<C, T, R>): Pick<fastq.queueAsPromised<T, R>, 'push'> {
				return {
					push: (task) => handler.call(this, task),
				};
			},
		},
	});

describe('Federation - Infrastructure - Queue - InMemoryQueue', () => {
	const queue = new InMemoryQueue();

	describe('#addToQueue()', () => {
		it('should throw an error if the instance was not set beforehand', () => {
			expect(() => queue.addToQueue({})).to.throw('You need to set the handler first');
		});

		it('should push the task to the queue instance to be handled when the instance was properly defined', () => {
			const spiedCb = spy(async () => undefined);
			const concurrency = 1;
			queue.setHandler(spiedCb, concurrency);
			queue.addToQueue({ task: 'my-task' });
			expect(spiedCb).to.have.been.called.with({ task: 'my-task' });
		});
	});
});
