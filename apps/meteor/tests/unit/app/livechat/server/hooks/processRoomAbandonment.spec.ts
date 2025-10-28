import { expect } from 'chai';
import { it, describe } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const settingsStub = sinon.stub();
const models = {
	LivechatDepartment: {
		findOneById: sinon.stub(),
	},
	LivechatBusinessHours: {
		findOneById: sinon.stub(),
	},
	Messages: {
		findAgentLastMessageByVisitorLastMessageTs: sinon.stub(),
	},
	LivechatRooms: {
		setVisitorInactivityInSecondsById: sinon.stub(),
	},
};

const businessHourManagerMock = {
	getBusinessHour: sinon.stub(),
};

const { getSecondsWhenOfficeHoursIsDisabled, parseDays, getSecondsSinceLastAgentResponse, onCloseRoom } = p
	.noCallThru()
	.load('../../../../../../app/livechat/server/hooks/processRoomAbandonment.ts', {
		'@rocket.chat/models': models,
		'../../../../lib/callbacks': {
			callbacks: { add: sinon.stub(), priority: { HIGH: 'high' } },
		},
		'../../../settings/server': {
			settings: { get: settingsStub },
		},
		'../business-hour': { businessHourManager: businessHourManagerMock },
	});

describe('processRoomAbandonment', () => {
	describe('getSecondsWhenOfficeHoursIsDisabled', () => {
		it('should return the seconds since the agents last message till room was closed', () => {
			const room = {
				closedAt: new Date('2024-01-01T12:00:10Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T12:00:00Z'),
			};
			const result = getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
			expect(result).to.be.equal(10);
		});
		it('should return the seconds since agents last message till now when room.closedAt is undefined', () => {
			const room = {
				closedAt: undefined,
			};
			const agentLastMessage = {
				ts: new Date(new Date().getTime() - 10000),
			};
			const result = getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
			expect(result).to.be.equal(10);
		});
	});
	describe('parseDays', () => {
		it('should properly return the days in the expected format', () => {
			const days = [
				{
					day: 'Monday',
					start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
					finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
					open: true,
				},
				{
					day: 'Tuesday',
					start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
					finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
					open: true,
				},
				{
					day: 'Wednesday',
					start: { utc: { dayOfWeek: 'Wednesday', time: '10:00' } },
					finish: { utc: { dayOfWeek: 'Wednesday', time: '11:00' } },
					open: true,
				},
			];

			const result = days.reduce(parseDays, {});
			expect(result).to.be.deep.equal({
				Monday: {
					start: { day: 'Monday', time: '10:00' },
					finish: { day: 'Monday', time: '11:00' },
					open: true,
				},
				Tuesday: {
					start: { day: 'Tuesday', time: '10:00' },
					finish: { day: 'Tuesday', time: '11:00' },
					open: true,
				},
				Wednesday: {
					start: { day: 'Wednesday', time: '10:00' },
					finish: { day: 'Wednesday', time: '11:00' },
					open: true,
				},
			});
		});
		it('should properly parse open/close days', () => {
			const days = [
				{
					day: 'Monday',
					start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
					finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
					open: true,
				},
				{
					day: 'Tuesday',
					start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
					finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
					open: false,
				},
				{
					day: 'Wednesday',
					start: { utc: { dayOfWeek: 'Wednesday', time: '10:00' } },
					finish: { utc: { dayOfWeek: 'Wednesday', time: '11:00' } },
					open: true,
				},
			];

			const result = days.reduce(parseDays, {});
			expect(result).to.be.deep.equal({
				Monday: {
					start: { day: 'Monday', time: '10:00' },
					finish: { day: 'Monday', time: '11:00' },
					open: true,
				},
				Tuesday: {
					start: { day: 'Tuesday', time: '10:00' },
					finish: { day: 'Tuesday', time: '11:00' },
					open: false,
				},
				Wednesday: {
					start: { day: 'Wednesday', time: '10:00' },
					finish: { day: 'Wednesday', time: '11:00' },
					open: true,
				},
			});
		});
	});
	describe('getSecondsSinceLastAgentResponse', () => {
		beforeEach(() => {
			settingsStub.reset();
			models.LivechatDepartment.findOneById.reset();
			models.LivechatBusinessHours.findOneById.reset();
			businessHourManagerMock.getBusinessHour.reset();
		});
		it('should return the seconds since agent last message when Livechat_enable_business_hours is false', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(false);
			const room = {
				closedAt: undefined,
			};
			const agentLastMessage = {
				ts: new Date(new Date().getTime() - 10000),
			};
			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(10);
		});
		it('should return the seconds since last agent message when room has a department but department has an invalid business hour attached', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			models.LivechatDepartment.findOneById.withArgs('departmentId').resolves({
				businessHourId: 'businessHourId',
			});
			models.LivechatBusinessHours.findOneById.withArgs('businessHourId').resolves(null);
			const room = {
				closedAt: undefined,
				departmentId: 'departmentId',
			};
			const agentLastMessage = {
				ts: new Date(new Date().getTime() - 10000),
			};
			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(models.LivechatDepartment.findOneById.calledWith(room.departmentId)).to.be.true;
			expect(result).to.be.equal(10);
		});
		it('should return the seconds since last agent message when department has a valid business hour but business hour doest have work hours', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			models.LivechatDepartment.findOneById.withArgs('departmentId').resolves({
				businessHourId: 'businessHourId',
			});
			models.LivechatBusinessHours.findOneById.withArgs('businessHourId').resolves({
				workHours: [],
			});
			businessHourManagerMock.getBusinessHour.withArgs('businessHourId').resolves(null);
			const room = {
				closedAt: undefined,
				departmentId: 'departmentId',
			};
			const agentLastMessage = {
				ts: new Date(new Date().getTime() - 10000),
			};
			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(10);
		});
		it('should return the seconds since last agent message when department has a valid business hour but business hour workhours is empty', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			models.LivechatDepartment.findOneById.withArgs('departmentId').resolves({
				businessHourId: 'businessHourId',
			});
			models.LivechatBusinessHours.findOneById.withArgs('businessHourId').resolves({
				workHours: [],
			});
			businessHourManagerMock.getBusinessHour.withArgs('businessHourId').resolves({
				workHours: [],
			});
			const room = {
				closedAt: undefined,
				departmentId: 'departmentId',
			};
			const agentLastMessage = {
				ts: new Date(new Date().getTime() - 10000),
			};
			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(10);
		});
		it('should get the data from the default business hour when room has no department attached and return the seconds since last agent message when default bh has no workhours', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [],
			});
			const room = {
				closedAt: undefined,
			};
			const agentLastMessage = {
				ts: new Date(new Date().getTime() - 10000),
			};
			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(models.LivechatDepartment.findOneById.called).to.be.false;
			expect(models.LivechatBusinessHours.findOneById.called).to.be.false;
			expect(businessHourManagerMock.getBusinessHour.called).to.be.true;
			expect(businessHourManagerMock.getBusinessHour.getCall(0).args.length).to.be.equal(0);
			expect(result).to.be.equal(10);
		});
		it('should return the proper number of seconds the room was inactive considering business hours (inactive same day)', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-01T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T00:00:00Z'),
			};

			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Wednesday',
						start: { utc: { dayOfWeek: 'Wednesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Wednesday', time: '11:00' } },
						open: true,
					},
				],
			});
			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(3600);
		});
		it('should return the proper number of seconds the room was inactive considering business hours (inactive same day)', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-01T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T00:00:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '23:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Wednesday',
						start: { utc: { dayOfWeek: 'Wednesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Wednesday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(7200);
		});
		it('should return 0 if a room happened to be inactive on a day outside of business hours', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-03T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-03T00:00:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(0);
		});
		it('should return the proper number of seconds when a room was inactive for more than 1 day', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-03T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T00:00:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(7200);
		});
		it('should return the proper number of seconds when a room was inactive for more than 1 day, and one of those days was a closed day', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-03T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T00:00:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: false,
					},
					{
						day: 'Wednesday',
						start: { utc: { dayOfWeek: 'Wednesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Wednesday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(7200);
		});
		it('should return the proper number of seconds when a room was inactive for more than 1 day and one of those days is not in configuration', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-03T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T00:00:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Wednesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(7200);
		});
		it('should return the proper number of seconds when a room has been inactive for more than a week', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-10T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T00:00:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Wednesday',
						start: { utc: { dayOfWeek: 'Wednesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Wednesday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Thursday',
						start: { utc: { dayOfWeek: 'Thursday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Thursday', time: '11:00' } },
						open: false,
					},
					{
						day: 'Saturday',
						start: { utc: { dayOfWeek: 'Friday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Friday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Sunday',
						start: { utc: { dayOfWeek: 'Saturday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Saturday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(28800);
		});
		it('should return 0 when room was inactive in the same day but the configuration for bh on that day is invalid', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-01T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T00:00:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: undefined } },
						finish: { utc: { dayOfWeek: 'Monday', time: undefined } },
						open: true,
					},
					{
						day: 'Wednesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: false,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(0);
		});
		it('should return the proper number of seconds when a room has been inactive for more than a day but the inactivity started after BH started', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-02T12:00:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T10:15:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(6300);
		});
		it('should return the proper number of seconds when a room was inactive between a BH start and end', async () => {
			settingsStub.withArgs('Livechat_enable_business_hours').returns(true);
			const room = {
				closedAt: new Date('2024-01-01T10:50:00Z'),
			};
			const agentLastMessage = {
				ts: new Date('2024-01-01T10:15:00Z'),
			};
			businessHourManagerMock.getBusinessHour.resolves({
				workHours: [
					{
						day: 'Monday',
						start: { utc: { dayOfWeek: 'Monday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Monday', time: '11:00' } },
						open: true,
					},
					{
						day: 'Tuesday',
						start: { utc: { dayOfWeek: 'Tuesday', time: '10:00' } },
						finish: { utc: { dayOfWeek: 'Tuesday', time: '11:00' } },
						open: true,
					},
				],
			});

			const result = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
			expect(result).to.be.equal(2100);
		});
	});
	describe('onCloseRoom', () => {
		beforeEach(() => {
			models.Messages.findAgentLastMessageByVisitorLastMessageTs.reset();
		});
		it('should skip the hook if room is not an omnichannel room', async () => {
			const param = { room: { t: 'd' } };
			const r = await onCloseRoom(param);

			expect(models.Messages.findAgentLastMessageByVisitorLastMessageTs.called).to.be.false;
			expect(r).to.be.equal(param);
		});
		it('should skip if room was not closed by agent', async () => {
			const param = { room: { t: 'l' }, closer: 'visitor' };
			const r = await onCloseRoom(param);

			expect(models.Messages.findAgentLastMessageByVisitorLastMessageTs.called).to.be.false;
			expect(r).to.be.equal(param);
		});
		it('should skip if the last message on room was not from an agent', async () => {
			const param = { room: { t: 'l' }, closer: 'user', lastMessage: { token: 'xxxx' } };
			const r = await onCloseRoom(param);

			expect(models.Messages.findAgentLastMessageByVisitorLastMessageTs.called).to.be.false;
			expect(r).to.be.equal(param);
		});
		it('should skip if the last message is not on db', async () => {
			models.Messages.findAgentLastMessageByVisitorLastMessageTs.resolves(null);
			const param = { room: { _id: 'xyz', t: 'l', v: { lastMessageTs: new Date() }, closer: 'user', lastMessage: { msg: 'test' } } };
			const r = await onCloseRoom(param);

			expect(models.Messages.findAgentLastMessageByVisitorLastMessageTs.calledWith('xyz', param.room.v.lastMessageTs)).to.be.true;
			expect(r).to.be.equal(param);
		});
		it('should skip if the visitor has not send any messages', async () => {
			models.Messages.findAgentLastMessageByVisitorLastMessageTs.resolves({ ts: undefined });
			const param = { room: { _id: 'xyz', t: 'l', v: { token: 'xfasfdsa' }, closer: 'user', lastMessage: { msg: 'test' } } };
			const r = await onCloseRoom(param);

			expect(models.Messages.findAgentLastMessageByVisitorLastMessageTs.called).to.be.false;
			expect(r).to.be.equal(param);
		});
		it('should set the visitor inactivity in seconds when all params are valid', async () => {
			models.Messages.findAgentLastMessageByVisitorLastMessageTs.resolves({ ts: new Date('2024-01-01T10:15:00Z') });
			settingsStub.withArgs('Livechat_enable_business_hours').returns(false);
			const param = {
				room: {
					_id: 'xyz',
					t: 'l',
					v: { lastMessageTs: new Date() },
					closedAt: new Date('2024-01-01T10:50:00Z'),
					closer: 'user',
					lastMessage: { msg: 'test' },
				},
			};
			const r = await onCloseRoom(param);

			expect(models.Messages.findAgentLastMessageByVisitorLastMessageTs.calledWith('xyz', param.room.v.lastMessageTs)).to.be.true;
			expect(models.LivechatRooms.setVisitorInactivityInSecondsById.calledWith('xyz', 2100)).to.be.true;
			expect(r).to.be.equal(param);
		});
	});
});
