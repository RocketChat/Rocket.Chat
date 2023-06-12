import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const queueAdapter = {
	enqueueJob: sinon.stub(),
};

const licenseStub = {
	isEnterprise: () => true,
};

const { PersistentQueue } = proxyquire
	.noCallThru()
	.load('../../../../../../server/services/federation/infrastructure/queue/PersistentQueue', {
		'RocketChatQueueAdapter': queueAdapter,
		'../../../../../ee/app/license/server': licenseStub,
	});

describe('Federation - Infrastructure - Queue - PersistentQueue', () => {
	const queue = new PersistentQueue();

	describe('#addToQueue()', () => {
		it('should push the task to the queue instance to be handled when the instance was properly defined', async () => {
			queue.addToQueue({ task: 'my-task' });

			expect(queueAdapter.enqueueJob.calledOnceWithExactly('federation-enterprise.handleMatrixEvent', { task: 'my-task' }));
		});
	});
});
