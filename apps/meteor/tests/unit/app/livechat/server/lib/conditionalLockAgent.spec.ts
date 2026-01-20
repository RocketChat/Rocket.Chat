import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mockUsers = {
	acquireAgentLock: sinon.stub(),
	releaseAgentLock: sinon.stub(),
};

const mockSettings = {
	get: sinon.stub(),
};

const { conditionalLockAgent } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/conditionalLockAgent', {
	'@rocket.chat/models': { Users: mockUsers },
	'../../../settings/server': { settings: mockSettings },
});

describe('conditionalLockAgent', () => {
	beforeEach(() => {
		mockUsers.acquireAgentLock.reset();
		mockUsers.releaseAgentLock.reset();
		mockSettings.get.reset();
	});

	describe('when waiting_queue is enabled', () => {
		beforeEach(() => {
			mockSettings.get.withArgs('Livechat_waiting_queue').returns(true);
		});

		it('should return acquired: true when lock is successfully acquired', async () => {
			mockUsers.acquireAgentLock.resolves(true);

			const result = await conditionalLockAgent('agent1', new Date());

			expect(result.acquired).to.equal(true);
			expect(result.required).to.equal(true);
			expect(mockUsers.acquireAgentLock.calledOnce).to.equal(true);
		});

		it('should return acquired: false when lock is already held by another process', async () => {
			mockUsers.acquireAgentLock.resolves(false);

			const result = await conditionalLockAgent('agent1', new Date());

			expect(result.acquired).to.equal(false);
			expect(result.required).to.equal(true);
			expect(mockUsers.acquireAgentLock.calledOnce).to.equal(true);
		});

		it('should call releaseAgentLock when unlock is called', async () => {
			mockUsers.acquireAgentLock.resolves(true);
			mockUsers.releaseAgentLock.resolves(true);

			const lockTime = new Date();
			const result = await conditionalLockAgent('agent1', lockTime);
			await result.unlock();

			expect(mockUsers.releaseAgentLock.calledOnceWith('agent1', lockTime)).to.equal(true);
		});

		it('should simulate concurrent lock attempts - second attempt blocked', async () => {
			// first call: lock acquired
			mockUsers.acquireAgentLock.onFirstCall().resolves(true);
			// second call: lock NOT acquired (held by first)
			mockUsers.acquireAgentLock.onSecondCall().resolves(false);

			const resultA = await conditionalLockAgent('agent1', new Date());
			const resultB = await conditionalLockAgent('agent1', new Date());

			expect(resultA.acquired).to.equal(true);
			expect(resultB.acquired).to.equal(false);
			expect(mockUsers.acquireAgentLock.calledTwice).to.equal(true);
		});
	});

	describe('when waiting_queue is disabled', () => {
		beforeEach(() => {
			mockSettings.get.withArgs('Livechat_waiting_queue').returns(false);
		});

		it('should return acquired: false and required: false without calling acquireAgentLock', async () => {
			const result = await conditionalLockAgent('agent1', new Date());

			expect(result.acquired).to.equal(false);
			expect(result.required).to.equal(false);
			expect(mockUsers.acquireAgentLock.called).to.equal(false);
		});

		it('should have a no-op unlock function', async () => {
			const result = await conditionalLockAgent('agent1', new Date());
			await result.unlock(); // should not throw an error

			expect(mockUsers.releaseAgentLock.called).to.equal(false);
		});
	});
});
