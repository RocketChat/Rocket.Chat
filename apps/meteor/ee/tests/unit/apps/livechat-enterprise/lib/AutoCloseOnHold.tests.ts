import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import { beforeEach, describe, it } from 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

chai.use(chaiDateTime);

const mockCronAddAtTimestamp = sinon.stub();
const mockCronRemove = sinon.stub();
const mockLivechatCloseRoom = sinon.stub();
const mockLivechatRooms = {
	findOneById: sinon.stub(),
};
const mockUsers = {
	findOneById: sinon.stub(),
};

const infoStub = sinon.stub();
const debugStub = sinon.stub();
const mockLogger = {
	section: sinon.stub().returns({
		info: infoStub,
		debug: debugStub,
	}),
};

const mocks = {
	'@rocket.chat/cron': {
		cronJobs: {
			addAtTimestamp: mockCronAddAtTimestamp,
			remove: mockCronRemove,
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
	it('should call logger.section upon instantiating', () => {
		expect(mockLogger.section.called).to.be.true;
	});

	describe('scheduleRoom', () => {
		beforeEach(() => {
			mockCronAddAtTimestamp.resetHistory();
			mockCronRemove.resetHistory();
		});

		it('should schedule a room', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			await scheduler.scheduleRoom('roomId', 5, 'test comment');

			const myScheduleTime = moment(new Date()).add(5, 's').toDate();
			expect(mockCronRemove.calledBefore(mockCronAddAtTimestamp)).to.be.true;
			expect(mockCronRemove.calledWith('omnichannel_auto_close_on_hold_scheduler-roomId')).to.be.true;
			expect(mockCronAddAtTimestamp.getCall(0).args[0]).to.be.equal('omnichannel_auto_close_on_hold_scheduler-roomId');
			expect(mockCronAddAtTimestamp.getCall(0).args[1]).to.be.closeToTime(myScheduleTime, 5);
			expect(mockCronAddAtTimestamp.getCall(0).args[2]).to.be.a('function');
		});
	});

	describe('unscheduleRoom', () => {
		beforeEach(() => {
			mockCronRemove.resetHistory();
		});

		it('should call .remove to unschedule a room', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			await scheduler.unscheduleRoom('roomId');

			expect(mockCronRemove.calledWith('omnichannel_auto_close_on_hold_scheduler-roomId')).to.be.true;
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
				await scheduler.executeJob('roomId', 'comment');
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
				await scheduler.executeJob('roomId', 'comment');
			} catch (e: any) {
				expect(e.message).to.be.equal('Scheduler user not found');
			}
		});

		it('should call Livechat.closeRoom if all data is valid', async () => {
			const scheduler = new AutoCloseOnHoldSchedulerClass();

			mockLivechatRooms.findOneById.returns({ _id: 'me' });
			mockUsers.findOneById.returns({ _id: 'rocket.cat' });

			await scheduler.executeJob('roomId', 'comment');

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
