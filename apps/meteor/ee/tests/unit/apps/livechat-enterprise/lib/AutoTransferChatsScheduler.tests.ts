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
const returnRoomAsInquiryMock = sinon.stub();
const mockMeteorStartup = sinon.stub();
const mockLivechatRooms = {
	findOneById: sinon.stub(),
	setAutoTransferOngoingById: sinon.stub(),
	unsetAutoTransferOngoingById: sinon.stub(),
	setAutoTransferredAtById: sinon.stub(),
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

const mockLogger = {
	section: sinon.stub().returns({
		info: sinon.stub(),
		debug: sinon.stub(),
		error: sinon.stub(),
	}),
};
const forwardRoomToAgent = sinon.stub();
const settingsGet = sinon.stub();
const routingConfigMock = sinon.stub();
const getNextAgent = sinon.stub();

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
	'../../../../../app/livechat/server/lib/RoutingManager': { RoutingManager: { getConfig: routingConfigMock, getNextAgent } },
	'../../../../../app/livechat/server/lib/Helper': { forwardRoomToAgent },
	'../../../../../app/livechat/server/lib/rooms': { returnRoomAsInquiry: returnRoomAsInquiryMock },
	'../../../../../app/settings/server': { settings: { get: settingsGet } },
	'./logger': { schedulerLogger: mockLogger },
	'@rocket.chat/models': {
		LivechatRooms: mockLivechatRooms,
		Users: mockUsers,
	},
};

const { AutoTransferChatSchedulerClass } = proxyquire
	.noCallThru()
	.load('../../../../../app/livechat-enterprise/server/lib/AutoTransferChatScheduler', mocks);

describe('AutoTransferChats', () => {
	describe('getSchedulerUser', () => {
		it('should return rocket.cat user', async () => {
			const scheduler = new AutoTransferChatSchedulerClass();
			mockUsers.findOneById.resolves({ _id: 'rocket.cat' });
			const user = await scheduler.getSchedulerUser();
			expect(user).to.be.deep.equal({ _id: 'rocket.cat' });
			expect(mockUsers.findOneById.calledWith('rocket.cat')).to.be.true;
		});
	});

	describe('scheduleRoom', () => {
		it('should schedule a room', async () => {
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();
			scheduler.unscheduleRoom = sinon.stub();

			const myScheduleTime = moment(new Date()).add(10, 's').toDate();
			await scheduler.scheduleRoom('roomId', 10);

			expect(scheduler.unscheduleRoom.calledWith('roomId')).to.be.true;
			expect(mockAgendaDefine.getCall(0).firstArg).to.be.equal('omnichannel_scheduler-roomId');
			const funcScheduleTime = mockAgendaScheduler.getCall(0).firstArg;

			expect(funcScheduleTime).to.be.closeToTime(myScheduleTime, 5);
			expect(mockLivechatRooms.setAutoTransferOngoingById.getCall(0).firstArg).to.be.equal('roomId');
		});
	});

	describe('unscheduleRoom', () => {
		it('should unschedule a room', async () => {
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			await scheduler.unscheduleRoom('roomId');

			expect(mockLivechatRooms.unsetAutoTransferOngoingById.getCall(0).firstArg).to.be.equal('roomId');
			expect(mockAgendaCancel.getCall(0).firstArg).to.be.deep.equal({ name: 'omnichannel_scheduler-roomId' });
		});
	});

	describe('executeJob', () => {
		it('should execute job', async () => {
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			scheduler.transferRoom = sinon.stub();

			await scheduler.executeJob({ attrs: { data: { roomId: 'roomId' } } });

			expect(scheduler.transferRoom.getCall(0).firstArg).to.be.equal('roomId');
			expect(mockLivechatRooms.setAutoTransferredAtById.getCall(0).firstArg).to.be.equal('roomId');
		});
		it('shouldnt fail even if job fails', async () => {
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			scheduler.transferRoom = sinon.stub().throws('dummy error');

			const r = await scheduler.executeJob({ attrs: { data: { roomId: 'roomId' } } });

			expect(r).to.be.undefined;
		});
	});

	describe('transferRoom', () => {
		beforeEach(() => {
			mockLivechatRooms.findOneById.reset();
			mockUsers.findOneById.reset();
			returnRoomAsInquiryMock.reset();
			getNextAgent.reset();
		});
		it('should not transfer undefined rooms', async () => {
			mockLivechatRooms.findOneById.resolves(undefined);
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			await expect(scheduler.transferRoom('roomId')).to.be.rejectedWith('Room is not open or is not being served by an agent');
		});
		it('should not transfer closed rooms', async () => {
			mockLivechatRooms.findOneById.resolves({ _id: 1 });
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			await expect(scheduler.transferRoom('roomId')).to.be.rejectedWith('Room is not open or is not being served by an agent');
		});
		it('should not transfer unserved rooms', async () => {
			mockLivechatRooms.findOneById.resolves({ _id: 1, open: true });
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			await expect(scheduler.transferRoom('roomId')).to.be.rejectedWith('Room is not open or is not being served by an agent');
		});
		it('should return a room as inquiry when the routing method is not automatic', async () => {
			mockLivechatRooms.findOneById.resolves({ _id: 1, open: true, servedBy: { _id: 2 }, departmentId: undefined });
			mockUsers.findOneById.resolves({ _id: 'rocket.cat' });
			settingsGet.returns(5);
			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			await scheduler.transferRoom('roomId');

			expect(
				returnRoomAsInquiryMock.calledWith(
					sinon.match({ _id: 1, open: true, servedBy: { _id: 2 } }),
					undefined,
					sinon.match({ scope: 'autoTransferUnansweredChatsToQueue', comment: '5', transferredBy: { _id: 'rocket.cat' } }),
				),
			).to.be.true;
		});
		it('should do nothing if routing manager returns no agents for automatic algo', async () => {
			mockLivechatRooms.findOneById.resolves({ _id: 1, open: true, servedBy: { _id: 2 }, departmentId: undefined });
			mockUsers.findOneById.resolves({ _id: 'rocket.cat' });
			routingConfigMock.returns({ autoAssignAgent: true });
			getNextAgent.resolves(undefined);
			settingsGet.returns(5);

			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			const r = await scheduler.transferRoom('roomId');

			expect(getNextAgent.calledWith(undefined, 2)).to.be.true;
			expect(r).to.be.undefined;
			expect(forwardRoomToAgent.notCalled).to.be.true;
		});
		it('should do nothing if cannot find rocket.cat', async () => {
			mockLivechatRooms.findOneById.resolves({ _id: 1, open: true, servedBy: { _id: 2 }, departmentId: undefined });
			mockUsers.findOneById.resolves(undefined);
			routingConfigMock.returns({ autoAssignAgent: true });
			getNextAgent.resolves({ agentId: 3 });
			settingsGet.returns(5);

			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			const r = await scheduler.transferRoom('roomId');

			expect(getNextAgent.calledWith(undefined, 2)).to.be.true;
			expect(r).to.be.undefined;
			expect(mockUsers.findOneById.called).to.be.true;
			expect(forwardRoomToAgent.notCalled).to.be.true;
		});
		it('should forward room to selected agent', async () => {
			mockLivechatRooms.findOneById.resolves({ _id: 1, open: true, servedBy: { _id: 2 }, departmentId: undefined });
			mockUsers.findOneById.resolves({ _id: 'rocket.cat' });
			routingConfigMock.returns({ autoAssignAgent: true });
			getNextAgent.resolves({ agentId: 3 });
			settingsGet.returns(5);

			const scheduler = new AutoTransferChatSchedulerClass();
			await scheduler.init();

			const r = await scheduler.transferRoom('roomId');

			expect(getNextAgent.calledWith(undefined, 2)).to.be.true;
			expect(r).to.be.undefined;
			expect(
				forwardRoomToAgent.calledWith(
					sinon.match({ _id: 1, open: true, servedBy: { _id: 2 }, departmentId: undefined }),
					sinon.match({
						userId: 3,
						transferredBy: { _id: 'rocket.cat', userType: 'user' },
						transferredTo: { agentId: 3 },
						scope: 'autoTransferUnansweredChatsToAgent',
						comment: '5',
					}),
				),
			).to.be.true;
		});
	});
});
