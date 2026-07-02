import type { InquiryWithAgentInfo } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { SinonStub } from 'sinon';
import { beforeEach, describe, afterAll, afterEach, it, vi } from 'vitest';

// Mock objects built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them. We also
// expose the hoisted sinon instance as `Sinon` and use it for the test-body stubs, so that every
// stub shares a single call-id counter — `calledAfter`/`calledBefore` compare those counters and
// would break across two different sinon module instances.
const {
	Sinon,
	dispatchAgentDelegated,
	getConfig,
	delegateInquiry,
	libSettings,
	settings,
	queueLogger,
	models,
	license,
	metrics,
	notifyOnLivechatInquiryChangedByRoom,
} = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		Sinon: sinon,
		dispatchAgentDelegated: sinon.stub(),
		getConfig: sinon.stub(),
		delegateInquiry: sinon.stub(),
		libSettings: { getInquirySortMechanismSetting: sinon.stub().returns('timestamp') },
		settings: { get: sinon.stub() },
		queueLogger: {
			info: sinon.stub(),
			debug: sinon.stub(),
			error: sinon.stub(),
		},
		models: {
			LivechatInquiry: {
				unlockAll: sinon.stub(),
				findNextAndLock: sinon.stub(),
				getDistinctQueuedDepartments: sinon.stub(),
				unlock: sinon.stub(),
				removeByRoomId: sinon.stub(),
				takeInquiry: sinon.stub(),
			},
			LivechatRooms: {
				findOneById: sinon.stub(),
			},
		},
		license: { shouldPreventAction: sinon.stub() },
		metrics: {
			timeToQueueProcessingByQueue: { observe: sinon.stub() },
			timeToQueueProcessingByQueueHistogram: { observe: sinon.stub() },
			totalItemsProcessedByQueue: { inc: sinon.stub() },
			totalItemsProcessedByReconciliationQueue: { inc: sinon.stub() },
			totalItemsFailedByQueue: { inc: sinon.stub() },
		},
		// Side-effect-only dependency: the source fires `void notifyOnLivechatInquiryChangedByRoom(...)`.
		// proxyquire left it real (and Mocha swallowed the rejections); stub it to silence noise.
		notifyOnLivechatInquiryChangedByRoom: sinon.stub(),
	};
});

const mockedInquiry = {
	_id: 'inquiryId',
	rid: 'rid',
	department: 'department1',
	ts: new Date(),
} as unknown as InquiryWithAgentInfo;

vi.mock('../../../../../app/livechat/server/lib/Helper', () => ({ dispatchAgentDelegated }));
vi.mock('../../../../../app/livechat/server/lib/RoutingManager', () => ({ RoutingManager: { getConfig, delegateInquiry } }));
vi.mock('../../../../../app/livechat/server/lib/settings', () => libSettings);
vi.mock('../../../../../app/settings/server', () => ({ settings }));
vi.mock('../../../../../server/services/omnichannel/logger', () => ({ queueLogger }));
vi.mock('@rocket.chat/models', () => models);
vi.mock('@rocket.chat/license', () => ({ License: license }));
vi.mock('../../../../../app/metrics/server', () => ({ metrics }));
vi.mock('../../../../../app/lib/server/lib/notifyListener', () => ({ notifyOnLivechatInquiryChangedByRoom }));

const { OmnichannelQueue } = await import('../../../../../server/services/omnichannel/queue');

describe('Omnichannel Queue processor', () => {
	describe('isRunning', () => {
		it('should return the running status', () => {
			const queue = new OmnichannelQueue();
			expect(queue.isRunning()).to.be.false;
		});
		it('should return the running status', () => {
			const queue = new OmnichannelQueue();
			(queue as any).running = true;
			expect(queue.isRunning()).to.be.true;
		});
	});
	describe('delay', () => {
		afterAll(() => {
			settings.get.reset();
		});
		it('should return 5000 if setting is not set', () => {
			settings.get.returns(undefined);

			const queue = new OmnichannelQueue();
			expect((queue as any).delay()).to.be.equal(5000);
		});
		it('should return the right value if setting has a value above 1', () => {
			settings.get.returns(10);

			const queue = new OmnichannelQueue();
			expect((queue as any).delay()).to.be.equal(10000);
		});
	});
	describe('getActiveQueues', () => {
		afterAll(() => {
			models.LivechatInquiry.getDistinctQueuedDepartments.reset();
		});
		it('should return empty array when there are no active queues', async () => {
			models.LivechatInquiry.getDistinctQueuedDepartments.resolves([]);

			const queue = new OmnichannelQueue();
			expect(await (queue as any).getActiveQueues()).to.be.eql([]);
		});
		it('should return [department1] when department1 is an active queue', async () => {
			models.LivechatInquiry.getDistinctQueuedDepartments.resolves([{ _id: 'department1' }]);

			const queue = new OmnichannelQueue();
			expect(await (queue as any).getActiveQueues()).to.be.eql(['department1']);
		});
		it('should return [null, department1] when department1 is an active queue and there are elements on public queue', async () => {
			models.LivechatInquiry.getDistinctQueuedDepartments.resolves([{ _id: 'department1' }, { _id: null }]);

			const queue = new OmnichannelQueue();
			expect(await (queue as any).getActiveQueues()).to.be.eql(['department1', null]);
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
		afterAll(() => {
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
			(queue as any).execute = Sinon.stub();
			expect(await (queue as any).checkQueue(null)).to.be.undefined;
		});
		it('should try to process the inquiry when there is one', async () => {
			models.LivechatInquiry.findNextAndLock.returns(mockedInquiry);

			const queue = new OmnichannelQueue();
			(queue as any).processWaitingQueue = Sinon.stub().throws('error');
			(queue as any).execute = Sinon.stub();
			await (queue as any).checkQueue(null);

			expect(models.LivechatInquiry.findNextAndLock.calledOnce).to.be.true;
			expect(((queue as any).processWaitingQueue as unknown as SinonStub).calledOnce).to.be.true;
		});
		it('should call unlock when the inquiry could not be processed', async () => {
			models.LivechatInquiry.findNextAndLock.returns(mockedInquiry);

			const queue = new OmnichannelQueue();
			(queue as any).processWaitingQueue = Sinon.stub().returns(false);
			(queue as any).execute = Sinon.stub();
			await (queue as any).checkQueue(null);

			expect(((queue as any).processWaitingQueue as unknown as SinonStub).calledOnce).to.be.true;
			expect(models.LivechatInquiry.unlock.calledOnce).to.be.true;
		});
		it('should unlock the inquiry when it was processed succesfully', async () => {
			models.LivechatInquiry.findNextAndLock.returns(mockedInquiry);

			const queue = new OmnichannelQueue();
			(queue as any).processWaitingQueue = Sinon.stub().returns(true);
			(queue as any).execute = Sinon.stub();
			await (queue as any).checkQueue(null);

			expect(((queue as any).processWaitingQueue as unknown as SinonStub).calledOnce).to.be.true;
			expect(models.LivechatInquiry.unlock.calledOnce).to.be.true;
		});
		it('should print a log when there was an error processing inquiry', async () => {
			models.LivechatInquiry.findNextAndLock.throws('error');

			const queue = new OmnichannelQueue();
			(queue as any).execute = Sinon.stub();
			await (queue as any).checkQueue(null);

			expect(queueLogger.error.calledOnce).to.be.true;
		});
	});
	describe('shouldStart', () => {
		beforeEach(() => {
			settings.get.resetHistory();
			getConfig.resetHistory();
		});
		afterAll(() => {
			settings.get.reset();
			getConfig.reset();
		});

		it('should call stop if Livechat is not enabled', async () => {
			settings.get.returns(false);

			const queue = new OmnichannelQueue();
			queue.stop = Sinon.stub();
			await queue.shouldStart();

			expect((queue.stop as unknown as SinonStub).calledOnce).to.be.true;
		});
		it('should call start if routing algorithm supports auto assignment', async () => {
			settings.get.returns(true);
			getConfig.returns({ autoAssignAgent: true });

			const queue = new OmnichannelQueue();
			queue.start = Sinon.stub();
			await queue.shouldStart();

			expect((queue.start as unknown as SinonStub).calledOnce).to.be.true;
			expect((queue.start as unknown as SinonStub).calledAfter(getConfig)).to.be.true;
		});
		it('should call stop if routing algorithm does not support auto assignment', async () => {
			settings.get.returns(true);
			getConfig.returns({ autoAssignAgent: false });

			const queue = new OmnichannelQueue();
			queue.stop = Sinon.stub();
			await queue.shouldStart();

			expect((queue.stop as unknown as SinonStub).calledOnce).to.be.true;
			expect((queue.stop as unknown as SinonStub).calledAfter(getConfig)).to.be.true;
		});
	});
	describe('reconciliation', () => {
		beforeEach(() => {
			models.LivechatInquiry.removeByRoomId.resetHistory();
			models.LivechatInquiry.takeInquiry.resetHistory();
		});

		it('should remove inquiries from rooms that do not exist', async () => {
			const queue = new OmnichannelQueue();
			await (queue as any).reconciliation('missing', { roomId: 'rid', inquiryId: 'inquiryId' });

			expect(models.LivechatInquiry.removeByRoomId.calledOnce).to.be.true;
		});
		it('should take an inquiry if the room was taken', async () => {
			const queue = new OmnichannelQueue();
			await (queue as any).reconciliation('taken', { roomId: 'rid', inquiryId: 'inquiryId' });

			expect(models.LivechatInquiry.takeInquiry.calledOnce).to.be.true;
		});
		it('should remove inquiries from rooms that were closed', async () => {
			const queue = new OmnichannelQueue();
			await (queue as any).reconciliation('closed', { roomId: 'rid', inquiryId: 'inquiryId' });

			expect(models.LivechatInquiry.removeByRoomId.calledOnce).to.be.true;
		});
		it('should return true for any other case', async () => {
			const queue = new OmnichannelQueue();
			expect(
				await (queue as any).reconciliation('random' as unknown as 'closed' | 'taken' | 'missing', {
					roomId: 'rid',
					inquiryId: 'inquiryId',
				}),
			).to.be.true;
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
		afterAll(() => {
			models.LivechatRooms.findOneById.reset();
			models.LivechatInquiry.takeInquiry.reset();
			delegateInquiry.reset();
			queueLogger.debug.reset();
			clock.reset();
		});

		it('should process the public queue when department is undefined', async () => {
			const queue = new OmnichannelQueue();

			expect(await (queue as any).processWaitingQueue(undefined as unknown as null, mockedInquiry)).to.be.true;
			expect(queueLogger.debug.calledWith('Processing inquiry inquiryId from queue Public'));
			expect(models.LivechatRooms.findOneById.calledOnce).to.be.true;
		});
		it('should call removeInquiry when findOneById returns null', async () => {
			models.LivechatRooms.findOneById.returns(null);

			const queue = new OmnichannelQueue();
			expect(await (queue as any).processWaitingQueue('department1', mockedInquiry)).to.be.true;
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
			(queue as any).reconciliation = Sinon.stub().returns(true);
			expect(await (queue as any).processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(((queue as any).reconciliation as unknown as SinonStub).calledOnce).to.be.true;
		});
		it('should call removeInquiry when findOneById returns a room that was closed', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid', closedAt: new Date() });

			const queue = new OmnichannelQueue();
			(queue as any).reconciliation = Sinon.stub().returns(true);
			expect(await (queue as any).processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(((queue as any).reconciliation as unknown as SinonStub).calledOnce).to.be.true;
		});
		it('should call delegateInquiry when prechecks are met and return false if inquiry was not served', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid' });
			delegateInquiry.returns({});

			const queue = new OmnichannelQueue();
			expect(await (queue as any).processWaitingQueue('department1', mockedInquiry)).to.be.false;
			expect(delegateInquiry.calledOnce).to.be.true;
		});
		it('should call delegateInquiry and return true if inquiry was served', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid' });
			delegateInquiry.returns({ _id: 'rid', servedBy: { _id: 'agentId' } });

			const queue = new OmnichannelQueue();
			expect(await (queue as any).processWaitingQueue('department1', mockedInquiry)).to.be.true;
			expect(delegateInquiry.calledOnce).to.be.true;
		});
		it('should call dispatchAgentDelegated if inquiry was served (after 1s)', async () => {
			models.LivechatRooms.findOneById.returns({ _id: 'rid' });
			delegateInquiry.returns({ _id: 'rid', servedBy: { _id: 'agentId' } });

			const queue = new OmnichannelQueue();
			expect(await (queue as any).processWaitingQueue('department1', mockedInquiry)).to.be.true;
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

		afterAll(() => {
			license.shouldPreventAction.reset();
			queueLogger.debug.reset();
		});

		it('should return undefined if service is not running', async () => {
			const queue = new OmnichannelQueue();
			(queue as any).running = false;
			expect(await (queue as any).execute()).to.be.undefined;
		});
		it('should return undefined if license is over mac limits', async () => {
			license.shouldPreventAction.returns(true);

			const queue = new OmnichannelQueue();
			(queue as any).running = true;
			expect(await (queue as any).execute()).to.be.undefined;
			expect(license.shouldPreventAction.calledOnce).to.be.true;
			expect((queue as any).running).to.be.false;
		});
		it('should try to process a queue if license is not over mac limits', async () => {
			license.shouldPreventAction.returns(false);

			const queue = new OmnichannelQueue();
			(queue as any).running = true;
			(queue as any).getActiveQueues = Sinon.stub().resolves([null]);
			await (queue as any).execute();

			expect(((queue as any).getActiveQueues as unknown as SinonStub).calledOnce).to.be.true;
		});
	});
	describe('start', () => {
		beforeEach(() => {
			queueLogger.info.resetHistory();
			queueLogger.debug.resetHistory();
		});
		afterAll(() => {
			queueLogger.info.reset();
			queueLogger.debug.reset();
		});
		it('should do nothing if queue is already running', async () => {
			const queue = new OmnichannelQueue();
			(queue as any).running = true;
			(queue as any).execute = Sinon.stub();
			await queue.start();

			expect(((queue as any).execute as unknown as SinonStub).notCalled).to.be.true;
		});
		it('should fetch active queues and set running to true', async () => {
			const queue = new OmnichannelQueue();
			(queue as any).running = false;
			(queue as any).getActiveQueues = Sinon.stub().returns(['department1']);
			(queue as any).execute = Sinon.stub();
			await queue.start();

			expect((queue as any).running).to.be.true;
			expect(((queue as any).getActiveQueues as unknown as SinonStub).calledOnce).to.be.true;
			expect(queueLogger.info.calledOnce).to.be.true;
			expect(queueLogger.info.calledWith('Service started')).to.be.true;
			expect(((queue as any).execute as unknown as SinonStub).calledOnce).to.be.true;
		});
	});
	describe('stop', () => {
		beforeEach(() => {
			models.LivechatInquiry.unlockAll.reset();
			queueLogger.info.resetHistory();
		});
		afterAll(() => {
			models.LivechatInquiry.unlockAll.reset();
			queueLogger.info.reset();
		});
		it('should unlock all inquiries and set running to false', async () => {
			const queue = new OmnichannelQueue();
			(queue as any).running = true;
			await queue.stop();

			expect((queue as any).running).to.be.false;
			expect(models.LivechatInquiry.unlockAll.calledOnce).to.be.true;
			expect(queueLogger.info.calledOnce).to.be.true;
			expect(queueLogger.info.calledWith('Service stopped')).to.be.true;
		});
	});
});
