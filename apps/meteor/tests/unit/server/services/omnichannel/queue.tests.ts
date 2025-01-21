import { expect } from 'chai';
import { beforeEach, describe, after, it } from 'mocha';
import p from 'proxyquire';
import Sinon from 'sinon';

const dispatchAgentDelegated = Sinon.stub();
const getConfig = Sinon.stub();
const delegateInquiry = Sinon.stub();
const libSettings = { getInquirySortMechanismSetting: Sinon.stub().returns('timestamp') };
const settings = {
	get: Sinon.stub(),
};

const queueLogger = {
	info: Sinon.stub(),
	debug: Sinon.stub(),
	error: Sinon.stub(),
};

const mockedInquiry = {
	_id: 'inquiryId',
	rid: 'rid',
	department: 'department1',
	ts: new Date(),
};

const models = {
	LivechatInquiry: {
		unlockAll: Sinon.stub(),
		findNextAndLock: Sinon.stub(),
		getDistinctQueuedDepartments: Sinon.stub(),
		unlock: Sinon.stub(),
		removeByRoomId: Sinon.stub(),
		takeInquiry: Sinon.stub(),
	},
	LivechatRooms: {
		findOneById: Sinon.stub(),
	},
};

const license = {
	shouldPreventAction: Sinon.stub(),
};

const { OmnichannelQueue } = p.noCallThru().load('../../../../../server/services/omnichannel/queue', {
	'../../../app/livechat/server/lib/Helper': {
		dispatchAgentDelegated,
	},
	'../../../app/livechat/server/lib/RoutingManager': {
		RoutingManager: {
			getConfig,
			delegateInquiry,
		},
	},
	'../../../app/livechat/server/lib/settings': libSettings,
	'../../../app/settings/server': { settings },
	'./logger': { queueLogger },
	'@rocket.chat/models': models,
	'@rocket.chat/license': { License: license },
});

describe('Omnichannel Queue processor', () => {
	describe('isRunning', () => {
		it('should return the running status', () => {
			const queue = new OmnichannelQueue();
			expect(queue.isRunning()).to.be.false;
		});
		it('should return the running status', () => {
			const queue = new OmnichannelQueue();
			queue.running = true;
			expect(queue.isRunning()).to.be.true;
		});
	});
	describe('delay', () => {
		after(() => {
			settings.get.reset();
		});
		it('should return 5000 if setting is not set', () => {
			settings.get.returns(undefined);

			const queue = new OmnichannelQueue();
			expect(queue.delay()).to.be.equal(5000);
		});
		it('should return the right value if setting has a value above 1', () => {
			settings.get.returns(10);

			const queue = new OmnichannelQueue();
			expect(queue.delay()).to.be.equal(10000);
		});
	});
	describe('getActiveQueues', () => {
		after(() => {
			models.LivechatInquiry.getDistinctQueuedDepartments.reset();
		});
		it('should return empty array when there are no active queues', async () => {
			models.LivechatInquiry.getDistinctQueuedDepartments.resolves([]);

			const queue = new OmnichannelQueue();
			expect(await queue.getActiveQueues()).to.be.eql([]);
		});
		it('should return [department1] when department1 is an active queue', async () => {
			models.LivechatInquiry.getDistinctQueuedDepartments.resolves([{ _id: 'department1' }]);

			const queue = new OmnichannelQueue();
			expect(await queue.getActiveQueues()).to.be.eql(['department1']);
		});
		it('should return [null, department1] when department1 is an active queue and there are elements on public queue', async () => {
			models.LivechatInquiry.getDistinctQueuedDepartments.resolves([{ _id: 'department1' }, { _id: null }]);

			const queue = new OmnichannelQueue();
			expect(await queue.getActiveQueues()).to.be.eql(['department1', null]);
		});
	});
	describe('checkQueue', () => {
		let clock: any;
		beforeEach(() => {
			models.LivechatInquiry.findNextAndLock.resetHistory();
			models.LivechatInquiry.takeInquiry.resetHistory();
			models.LivechatInquiry.unlock.resetHistory();
			queueLogger.error.resetHistory();
			queueLogger.info.resetHistory();
			clock = Sinon.useFakeTimers();
		});
		afterEach(() => {
			clock.restore();
		});
		after(() => {
			models.LivechatInquiry.findNextAndLock.reset();
			models.LivechatInquiry.takeInquiry.reset();
			models.LivechatInquiry.unlock.reset();
			queueLogger.error.reset();
			queueLogger.info.reset();
			clock.reset();
		});

		it('should return undefined when the queue is empty', async () => {
			models.LivechatInquiry.findNextAndLock.returns(null);

			const queue = new OmnichannelQueue();
			queue.execute = Sinon.stub();
			expect(await queue.checkQueue()).to.be.undefined;
		});
		it('should try to process the inquiry when there is one', async () => {
			models.LivechatInquiry.findNextAndLock.returns(mockedInquiry);

			const queue = new OmnichannelQueue();
			queue.processWaitingQueue = Sinon.stub().throws('error');
			queue.execute = Sinon.stub();
			await queue.checkQueue();

			expect(models.LivechatInquiry.findNextAndLock.calledOnce).to.be.true;
			expect(queue.processWaitingQueue.calledOnce).to.be.true;
		});
		it('should call unlock when the inquiry could not be processed', async () => {
			models.LivechatInquiry.findNextAndLock.returns(mockedInquiry);

			const queue = new OmnichannelQueue();
			queue.processWaitingQueue = Sinon.stub().returns(false);
			queue.execute = Sinon.stub();
			await queue.checkQueue();

			expect(queue.processWaitingQueue.calledOnce).to.be.true;
			expect(models.LivechatInquiry.unlock.calledOnce).to.be.true;
		});
		it('should unlock the inquiry when it was processed succesfully', async () => {
			models.LivechatInquiry.findNextAndLock.returns(mockedInquiry);

			const queue = new OmnichannelQueue();
			queue.processWaitingQueue = Sinon.stub().returns(true);
			queue.execute = Sinon.stub();
			await queue.checkQueue();

			expect(queue.processWaitingQueue.calledOnce).to.be.true;
			expect(models.LivechatInquiry.unlock.calledOnce).to.be.true;
		});
		it('should print a log when there was an error processing inquiry', async () => {
			models.LivechatInquiry.findNextAndLock.throws('error');

			const queue = new OmnichannelQueue();
			queue.execute = Sinon.stub();
			await queue.checkQueue();

			expect(queueLogger.error.calledOnce).to.be.true;
		});
	});
	describe('shouldStart', () => {
		beforeEach(() => {
			settings.get.resetHistory();
			getConfig.resetHistory();
		});
		after(() => {
			settings.get.reset();
			getConfig.reset();
		});

		it('should call stop if Livechat is not enabled', async () => {
			settings.get.returns(false);

			const queue = new OmnichannelQueue();
			queue.stop = Sinon.stub();
			await queue.shouldStart();

			expect(queue.stop.calledOnce).to.be.true;
		});
		it('should call start if routing algorithm supports auto assignment', async () => {
			settings.get.returns(true);
			getConfig.returns({ autoAssignAgent: true });

			const queue = new OmnichannelQueue();
			queue.start = Sinon.stub();
			await queue.shouldStart();

			expect(queue.start.calledOnce).to.be.true;
			expect(queue.start.calledAfter(getConfig)).to.be.true;
		});
		it('should call stop if routing algorithm does not support auto assignment', async () => {
			settings.get.returns(true);
			getConfig.returns({ autoAssignAgent: false });

			const queue = new OmnichannelQueue();
			queue.stop = Sinon.stub();
			await queue.shouldStart();

			expect(queue.stop.calledOnce).to.be.true;
			expect(queue.stop.calledAfter(getConfig)).to.be.true;
		});
	});
	describe('reconciliation', () => {
		beforeEach(() => {
			models.LivechatInquiry.removeByRoomId.resetHistory();
			models.LivechatInquiry.takeInquiry.resetHistory();
		});

		it('should remove inquiries from rooms that do not exist', async () => {
			const queue = new OmnichannelQueue();
			await queue.reconciliation('missing', { roomId: 'rid', inquiryId: 'inquiryId' });

			expect(models.LivechatInquiry.removeByRoomId.calledOnce).to.be.true;
		});
		it('should take an inquiry if the room was taken', async () => {
			const queue = new OmnichannelQueue();
			await queue.reconciliation('taken', { roomId: 'rid', inquiryId: 'inquiryId' });

			expect(models.LivechatInquiry.takeInquiry.calledOnce).to.be.true;
		});
		it('should remove inquiries from rooms that were closed', async () => {
			const queue = new OmnichannelQueue();
			await queue.reconciliation('closed', { roomId: 'rid', inquiryId: 'inquiryId' });

			expect(models.LivechatInquiry.removeByRoomId.calledOnce).to.be.true;
		});
		it('should return true for any other case', async () => {
			const queue = new OmnichannelQueue();
			expect(await queue.reconciliation('random', { roomId: 'rid', inquiryId: 'inquiryId' })).to.be.true;
			expect(models.LivechatInquiry.removeByRoomId.notCalled).to.be.true;
			expect(models.LivechatInquiry.takeInquiry.notCalled).to.be.true;
		});
	});
	describe('processWaitingQueue', () => {
		let clock: any;
		beforeEach(() => {
			models.LivechatRooms.findOneById.reset();
			models.LivechatInquiry.takeInquiry.resetHistory();
			models.LivechatInquiry.removeByRoomId.resetHistory();
			delegateInquiry.resetHistory();
			queueLogger.debug.resetHistory();
			clock = Sinon.useFakeTimers();
		});
		afterEach(() => {
			clock.restore();
		});
		after(() => {
			models.LivechatRooms.findOneById.reset();
			models.LivechatInquiry.takeInquiry.reset();
			delegateInquiry.reset();
			queueLogger.debug.reset();
			clock.reset();
		});

		it('should process the public queue when department is undefined', async () => {
			const queue = new OmnichannelQueue();

			expect(await queue.processWaitingQueue(undefined, mockedInquiry)).to.be.true;
			expect(queueLogger.debug.calledWith('Processing inquiry inquiryId from queue Public'));
			expect(models.LivechatRooms.findOneById.calledOnce).to.be.true;
		});
		it('should call removeInquiry when findOneById returns null', async () => {
			models.LivechatRooms.findOneById.returns(null);

			const queue = new OmnichannelQueue();
			expect(await queue.processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(
				queueLogger.debug.calledWith({
					msg: 'Room from inquiry missing. Removing inquiry',
					roomId: 'rid',
					inquiryId: 'inquiryId',
					step: 'reconciliation',
				}),
			).to.be.true;
			expect(models.LivechatInquiry.removeByRoomId.calledOnce).to.be.true;
		});
		it('should call takeInquiry when findOneById returns a room thats already being served', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid', servedBy: { some: 'thing' } });

			const queue = new OmnichannelQueue();
			queue.reconciliation = Sinon.stub().returns(true);
			expect(await queue.processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(queue.reconciliation.calledOnce).to.be.true;
		});
		it('should call removeInquiry when findOneById returns a room that was closed', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid', closedAt: new Date() });

			const queue = new OmnichannelQueue();
			queue.reconciliation = Sinon.stub().returns(true);
			expect(await queue.processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(queue.reconciliation.calledOnce).to.be.true;
		});
		it('should call delegateInquiry when prechecks are met and return false if inquiry was not served', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid' });
			delegateInquiry.returns({});

			const queue = new OmnichannelQueue();
			expect(await queue.processWaitingQueue('department1', mockedInquiry)).to.be.false;
			expect(delegateInquiry.calledOnce).to.be.true;
		});
		it('should call delegateInquiry and return true if inquiry was served', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid' });
			delegateInquiry.returns({ _id: 'rid', servedBy: { _id: 'agentId' } });

			const queue = new OmnichannelQueue();
			expect(await queue.processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(delegateInquiry.calledOnce).to.be.true;
		});
		it('should call dispatchAgentDelegated if inquiry was served (after 1s)', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid' });
			delegateInquiry.returns({ _id: 'rid', servedBy: { _id: 'agentId' } });

			const queue = new OmnichannelQueue();
			expect(await queue.processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(delegateInquiry.calledOnce).to.be.true;
			clock.tick(1000);
			expect(dispatchAgentDelegated.calledOnce).to.be.true;
		});
	});
	describe('execute', () => {
		beforeEach(() => {
			license.shouldPreventAction.reset();
			queueLogger.debug.reset();
		});

		after(() => {
			license.shouldPreventAction.reset();
			queueLogger.debug.reset();
		});

		it('should return undefined if service is not running', async () => {
			const queue = new OmnichannelQueue();
			queue.running = false;
			expect(await queue.execute()).to.be.undefined;
		});
		it('should return undefined if license is over mac limits', async () => {
			license.shouldPreventAction.returns(true);

			const queue = new OmnichannelQueue();
			queue.running = true;
			expect(await queue.execute()).to.be.undefined;
			expect(license.shouldPreventAction.calledOnce).to.be.true;
			expect(queue.running).to.be.false;
		});
		it('should try to process a queue if license is not over mac limits', async () => {
			license.shouldPreventAction.returns(false);

			const queue = new OmnichannelQueue();
			queue.running = true;
			queue.getActiveQueues = Sinon.stub().resolves([null]);
			await queue.execute();

			expect(queue.getActiveQueues.calledOnce).to.be.true;
			expect(queueLogger.debug.calledWith('Processing items for queue Public')).to.be.true;
		});
	});
	describe('start', () => {
		beforeEach(() => {
			queueLogger.info.resetHistory();
			queueLogger.debug.resetHistory();
		});
		after(() => {
			queueLogger.info.reset();
			queueLogger.debug.reset();
		});
		it('should do nothing if queue is already running', async () => {
			const queue = new OmnichannelQueue();
			queue.running = true;
			queue.execute = Sinon.stub();
			await queue.start();

			expect(queue.execute.notCalled).to.be.true;
		});
		it('should fetch active queues and set running to true', async () => {
			const queue = new OmnichannelQueue();
			queue.running = false;
			queue.getActiveQueues = Sinon.stub().returns(['department1']);
			queue.execute = Sinon.stub();
			await queue.start();

			expect(queue.running).to.be.true;
			expect(queue.getActiveQueues.calledOnce).to.be.true;
			expect(queueLogger.info.calledOnce).to.be.true;
			expect(queueLogger.info.calledWith('Service started')).to.be.true;
			expect(queue.execute.calledOnce).to.be.true;
		});
	});
	describe('stop', () => {
		beforeEach(() => {
			models.LivechatInquiry.unlockAll.reset();
			queueLogger.info.resetHistory();
		});
		after(() => {
			models.LivechatInquiry.unlockAll.reset();
			queueLogger.info.reset();
		});
		it('should unlock all inquiries and set running to false', async () => {
			const queue = new OmnichannelQueue();
			queue.running = true;
			await queue.stop();

			expect(queue.running).to.be.false;
			expect(models.LivechatInquiry.unlockAll.calledOnce).to.be.true;
			expect(queueLogger.info.calledOnce).to.be.true;
			expect(queueLogger.info.calledWith('Service stopped')).to.be.true;
		});
	});
});
