import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import { beforeEach, describe, it } from 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

chai.use(chaiDateTime);

const mockAgendaConstructor = sinon.stub();
const mockAgendaStart = sinon.stub();
const mockAgendaScheduler = sinon.stub();
const mockAgendaCancel = sinon.stub();
const mockAgendaDefine = sinon.stub();
const mockLivechatCloseRoom = sinon.stub();
const mockMeteorStartup = sinon.stub();
const mockLivechatRooms = {
	findOneById: sinon.stub(),
};
const mockUsers = {
	findOneById: sinon.stub(),
};

class MockAgendaClass {
	constructor(opts: Record<string, any>) {
		mockAgendaConstructor(opts);
	}

	async start() {
		return mockAgendaStart();
	}

	async schedule(...args: any) {
		return mockAgendaScheduler(...args);
	}

	async cancel(...args: any) {
		return mockAgendaCancel(...args);
	}

	async define(...args: any) {
		return mockAgendaDefine(...args);
	}
}

const infoStub = sinon.stub();
const debugStub = sinon.stub();
const mockLogger = {
	section: sinon.stub().returns({
		info: infoStub,
		debug: debugStub,
	}),
};

const mocks = {
	'@rocket.chat/agenda': { Agenda: MockAgendaClass },
	'meteor/meteor': { Meteor: { startup: mockMeteorStartup } },
	'meteor/mongo': {
		MongoInternals: {
			defaultRemoteCollectionDriver: () => {
				return {
					mongo: { client: { db: sinon.stub() } },
				};
			},
		},
	},
	'../../../../../app/livechat/server/lib/closeRoom': { closeRoom: mockLivechatCloseRoom },
	'./logger': { schedulerLogger: mockLogger },
	'@rocket.chat/models': {
		LivechatRooms: mockLivechatRooms,
		Users: mockUsers,
	},
};

const { AutoCloseOnHoldSchedulerClass } = proxyquire
	.noCallThru()
	.load('../../../../../app/livechat-enterprise/server/lib/AutoCloseOnHoldScheduler', mocks);

describe('AutoCloseOnHoldScheduler', () => {
	beforeEach(() => {
		mockMeteorStartup.resetHistory();
	});

	it('should call logger.section upon instantiating', () => {
		expect(mockLogger.section.called).to.be.true;
	});

	describe('init', () => {
		beforeEach(() => {
			mockAgendaStart.resetHistory();
			mockAgendaScheduler.resetHistory();
		});

		it('should do nothing if scheduler is already running', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();
			scheduler.running = true;

			await scheduler.init();

			expect(mockAgendaScheduler.called).to.be.false;
		});

		it('should succesfully init the scheduler', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			await scheduler.init();

			expect(mockAgendaStart.calledOnce).to.be.true;
			expect(scheduler.running).to.be.true;
			expect(infoStub.calledWith('Service started')).to.be.true;
		});
	});

	describe('scheduleRoom', () => {
		beforeEach(() => {
			mockAgendaCancel.resetHistory();
			mockAgendaDefine.resetHistory();
		});

		it('should fail if scheduler has not been init', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			try {
				await scheduler.scheduleRoom('roomId', 5, 'test comment');
			} catch (e: any) {
				expect(e.message).to.equal('AutoCloseOnHoldScheduler is not running');
			}
		});

		it('should schedule a room', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			await scheduler.init();
			await scheduler.scheduleRoom('roomId', 5, 'test comment');

			const myScheduleTime = moment(new Date()).add(5, 's').toDate();
			expect(mockAgendaCancel.calledBefore(mockAgendaDefine)).to.be.true;
			expect(mockAgendaCancel.calledWith({ name: 'omnichannel_auto_close_on_hold_scheduler-roomId' }));
			expect(mockAgendaDefine.calledWithMatch('omnichannel_auto_close_on_hold_scheduler-roomId'));
			const funcScheduleTime = mockAgendaScheduler.getCall(0).firstArg;

			expect(funcScheduleTime).to.be.closeToTime(myScheduleTime, 5);
			expect(mockAgendaScheduler.calledWithMatch('omnichannel_auto_close_on_hold_scheduler-roomId'));
		});
	});

	describe('unscheduleRoom', () => {
		beforeEach(() => {
			mockAgendaCancel.resetHistory();
		});

		it('should fail if scheduler has not been init', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			try {
				await scheduler.unscheduleRoom('roomId');
			} catch (e: any) {
				expect(e.message).to.equal('AutoCloseOnHoldScheduler is not running');
			}
		});

		it('should call .cancel to unschedule a room', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			await scheduler.init();

			await scheduler.unscheduleRoom('roomId');

			expect(mockAgendaCancel.calledWith({ name: 'omnichannel_auto_close_on_hold_scheduler-roomId' }));
		});
	});

	describe('executeJob', () => {
		beforeEach(() => {
			mockLivechatCloseRoom.resetHistory();
			mockLivechatRooms.findOneById.reset();
			mockUsers.findOneById.reset();
		});

		it('should throw if roomId is invalid', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			mockLivechatRooms.findOneById.returns(null);
			mockUsers.findOneById.returns({ _id: 'rocket.cat' });

			try {
				await scheduler.executeJob({ attrs: { data: { roomId: 'roomId', comment: 'comment' } } });
			} catch (e: any) {
				expect(e.message).to.be.equal(
					'Unable to process AutoCloseOnHoldScheduler job because room or user not found for roomId: roomId and userId: rocket.cat',
				);
			}
		});

		it('should throw if user returned from scheduleUser is invalid', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			mockLivechatRooms.findOneById.returns({ _id: 'me' });
			mockUsers.findOneById.returns(null);

			try {
				await scheduler.executeJob({ attrs: { data: { roomId: 'roomId', comment: 'comment' } } });
			} catch (e: any) {
				expect(e.message).to.be.equal('Scheduler user not found');
			}
		});

		it('should call Livechat.closeRoom if all data is valid', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			mockLivechatRooms.findOneById.returns({ _id: 'me' });
			mockUsers.findOneById.returns({ _id: 'rocket.cat' });

			await scheduler.executeJob({ attrs: { data: { roomId: 'roomId', comment: 'comment' } } });

			expect(mockLivechatCloseRoom.calledWithMatch({ room: { _id: 'me' }, user: { _id: 'rocket.cat' }, comment: 'comment' }));
		});
	});

	describe('getSchedulerUser', () => {
		beforeEach(() => {
			mockUsers.findOneById.reset();
		});

		it('should do nothing when schedulerUser is already set', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();
			scheduler.schedulerUser = { _id: 'me' };

			const user = await scheduler.getSchedulerUser();

			expect(user).to.be.equal(scheduler.schedulerUser);
		});

		it('should fail when rocket.cat does not exist', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			mockUsers.findOneById.returns(null);

			try {
				await scheduler.getSchedulerUser();
			} catch (e: any) {
				expect(e.message).to.be.equal('Scheduler user not found');
			}
		});

		it('should return rocket.cat', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			mockUsers.findOneById.returns({ _id: 'rocket.cat' });

			const u = await scheduler.getSchedulerUser();

			expect(u).to.be.an('object').with.property('_id', 'rocket.cat');
		});
	});
});
