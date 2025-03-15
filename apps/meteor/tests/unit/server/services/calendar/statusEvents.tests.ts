import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsMock = {
	get: sinon.stub().returns(true),
};

const CalendarEventMock = {
	find: sinon.stub(),
	findOne: sinon.stub(),
};

const UsersMock = {
	findOneById: sinon.stub(),
	updateOne: sinon.stub(),
};

const cronJobsMock = {
	has: sinon.stub().resolves(false),
	remove: sinon.stub().resolves(),
	addAtTimestamp: sinon.stub().resolves(),
};

const { StatusEventManager } = proxyquire.noCallThru().load('../../../../../server/services/calendar/statusEvents', {
	'../../../app/settings/server': { settings: settingsMock },
	'@rocket.chat/core-services': { api },
	'@rocket.chat/cron': { cronJobs: cronJobsMock },
	'@rocket.chat/models': {
		CalendarEvent: CalendarEventMock,
		Users: UsersMock,
	},
});

describe('StatusEventManager', () => {
	let sandbox: sinon.SinonSandbox;
	let manager: InstanceType<typeof StatusEventManager>;
	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';
	const fakeStartTime = new Date('2025-01-01T10:00:00Z');
	const fakeEndTime = new Date('2025-01-01T11:00:00Z');

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		manager = new StatusEventManager();
		setupCronJobsMocks();
		setupCalendarEventMocks();
		setupUsersMocks();
		setupOtherMocks();
	});

	function setupCronJobsMocks() {
		const freshMocks = {
			has: sinon.stub().resolves(false),
			remove: sinon.stub().resolves(),
			addAtTimestamp: sinon.stub().resolves(),
		};

		Object.assign(cronJobsMock, freshMocks);
	}

	function setupCalendarEventMocks() {
		const freshMocks = {
			find: sinon.stub().returns({
				toArray: sinon.stub().resolves([]),
			} as any),
			findOne: sinon.stub().resolves(null),
		};

		Object.assign(CalendarEventMock, freshMocks);
	}

	function setupUsersMocks() {
		const freshMocks = {
			findOneById: sinon.stub().resolves({
				_id: fakeUserId,
				status: UserStatus.ONLINE,
				roles: ['user'],
				username: 'testuser',
				name: 'Test User',
			} as any),
			updateOne: sinon.stub().resolves({ modifiedCount: 1 } as any),
		};

		Object.assign(UsersMock, freshMocks);
	}

	function setupOtherMocks() {
		sandbox.stub(api, 'broadcast').resolves();

		Object.assign(settingsMock, {
			get: sinon.stub().returns(true),
		});
	}

	afterEach(() => {
		sandbox.restore();
	});

	describe('#generateCronJobId', () => {
		it('should generate correct ID for status events', () => {
			const id = manager.generateCronJobId(fakeEventId, fakeUserId, 'status');
			expect(id).to.equal(`calendar-presence-status-${fakeEventId}-${fakeUserId}`);
		});

		it('should generate correct ID for reminder events', () => {
			const id = manager.generateCronJobId(fakeEventId, fakeUserId, 'reminder');
			expect(id).to.equal(`calendar-reminder-${fakeEventId}-${fakeUserId}`);
		});

		it('should throw an error if some required parameters are missing', () => {
			expect(() => manager.generateCronJobId(undefined, fakeUserId, 'status')).to.throw(
				'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
			);
			expect(() => manager.generateCronJobId(fakeEventId, undefined, 'status')).to.throw(
				'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
			);
			expect(() => manager.generateCronJobId(fakeEventId, fakeUserId)).to.throw(
				'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
			);
		});

		it('should throw an error if eventType is not "status" or "reminder"', () => {
			expect(() => manager.generateCronJobId(fakeEventId, fakeUserId, 'invalid' as any)).to.throw(
				'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
			);
		});
	});

	describe('#removeCronJobs', () => {
		it('should check and remove status and reminder jobs', async () => {
			cronJobsMock.has.resolves(true);

			await manager.removeCronJobs(fakeEventId, fakeUserId);

			expect(cronJobsMock.has.callCount).to.equal(2);
			expect(cronJobsMock.remove.callCount).to.equal(2);

			const statusId = `calendar-presence-status-${fakeEventId}-${fakeUserId}`;
			const reminderId = `calendar-reminder-${fakeEventId}-${fakeUserId}`;

			expect(cronJobsMock.has.firstCall.args[0]).to.equal(statusId);
			expect(cronJobsMock.has.secondCall.args[0]).to.equal(reminderId);
			expect(cronJobsMock.remove.firstCall.args[0]).to.equal(statusId);
			expect(cronJobsMock.remove.secondCall.args[0]).to.equal(reminderId);
		});

		it('should not remove jobs if they do not exist', async () => {
			cronJobsMock.has.resolves(false);

			await manager.removeCronJobs(fakeEventId, fakeUserId);

			expect(cronJobsMock.has.callCount).to.equal(2);
			expect(cronJobsMock.remove.callCount).to.equal(0);
		});
	});

	describe('#handleOverlappingEvents', () => {
		it('should return shouldProceed=true when no overlapping events', async () => {
			CalendarEventMock.find.returns({
				toArray: sinon.stub().resolves([]),
			});

			const result = await manager.handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
		});

		it('should handle case when current event is not the latest ending', async () => {
			const laterEvent = {
				_id: 'laterEvent',
				startTime: fakeStartTime,
				endTime: new Date('2025-01-01T12:00:00Z'), // Later than fakeEndTime
			};

			CalendarEventMock.find.returns({
				toArray: sinon.stub().resolves([laterEvent]),
			} as any);

			const result = await manager.handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: false });
			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(1);
			expect(cronJobsMock.addAtTimestamp.firstCall.args[1]).to.equal(fakeStartTime);
		});

		it('should remove status jobs for events ending before the current one', async () => {
			const earlierEvent = {
				_id: 'earlierEvent',
				startTime: new Date('2025-01-01T09:00:00Z'),
				endTime: new Date('2025-01-01T10:30:00Z'), // Earlier than fakeEndTime
			};

			CalendarEventMock.find.returns({
				toArray: sinon.stub().resolves([earlierEvent]),
			} as any);
			cronJobsMock.has.resolves(true);

			const result = await manager.handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.remove.callCount).to.equal(1);
			expect(cronJobsMock.remove.firstCall.args[0]).to.include('earlierEvent');
		});
	});

	describe('#setupAppointmentStatusChange', () => {
		it('should do nothing if busy status setting is disabled', async () => {
			settingsMock.get.returns(false);

			await manager.setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, undefined, false);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
		});

		it('should do nothing if endTime is not provided', async () => {
			await manager.setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, undefined, undefined, false);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
		});

		it('should handle overlapping events when shouldScheduleRemoval=true', async () => {
			const handleOverlappingStub = sandbox.stub(manager, 'handleOverlappingEvents').resolves({ shouldProceed: false });

			await manager.setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, true);

			expect(handleOverlappingStub.callCount).to.equal(1);
			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
		});

		it('should schedule status change at the start time when shouldScheduleRemoval=true', async () => {
			sandbox.stub(manager, 'handleOverlappingEvents').resolves({ shouldProceed: true });

			await manager.setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, true);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(1);
			expect(cronJobsMock.addAtTimestamp.firstCall.args[1]).to.equal(fakeStartTime);
		});

		it('should schedule status change at the end time when shouldScheduleRemoval=false', async () => {
			await manager.setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, false);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(1);
			expect(cronJobsMock.addAtTimestamp.firstCall.args[1]).to.equal(fakeEndTime);
		});
	});

	describe('#applyStatusChange', () => {
		it('should do nothing if user is not found', async () => {
			UsersMock.findOneById.resolves(null);

			await manager.applyStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, undefined, false);

			expect(UsersMock.updateOne.callCount).to.equal(0);
			expect((api.broadcast as sinon.SinonStub).callCount).to.equal(0);
		});

		it('should do nothing if user is offline', async () => {
			UsersMock.findOneById.resolves({
				_id: fakeUserId,
				status: UserStatus.OFFLINE,
			});

			await manager.applyStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, undefined, false);

			expect(UsersMock.updateOne.callCount).to.equal(0);
			expect((api.broadcast as sinon.SinonStub).callCount).to.equal(0);
		});

		it('should use UserStatus.BUSY as default if no status provided', async () => {
			await manager.applyStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, undefined, false);

			expect(UsersMock.updateOne.firstCall.args[1].$set.status).to.equal(UserStatus.BUSY);
		});

		it('should update user status and broadcast presence update', async () => {
			const previousStatus = UserStatus.ONLINE;
			const newStatus = UserStatus.AWAY;

			UsersMock.findOneById.resolves({
				_id: fakeUserId,
				status: previousStatus,
				roles: ['user'],
				username: 'testuser',
				name: 'Test User',
			});

			await manager.applyStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, newStatus, false);

			expect(UsersMock.updateOne.callCount).to.equal(1);
			expect(UsersMock.updateOne.firstCall.args[0]).to.deep.equal({ _id: fakeUserId });
			expect(UsersMock.updateOne.firstCall.args[1].$set).to.deep.equal({
				status: newStatus,
				statusDefault: newStatus,
			});

			expect((api.broadcast as sinon.SinonStub).callCount).to.equal(1);
			expect((api.broadcast as sinon.SinonStub).firstCall.args[0]).to.equal('presence.status');

			// Use a more flexible check for the user object
			const broadcastArg = (api.broadcast as sinon.SinonStub).firstCall.args[1];
			expect(broadcastArg).to.have.property('previousStatus', previousStatus);
			expect(broadcastArg.user).to.include({
				_id: fakeUserId,
				status: newStatus,
			});
		});

		it('should schedule status revert when shouldScheduleRemoval=true', async () => {
			sandbox.stub(manager, 'setupAppointmentStatusChange').resolves();
			const previousStatus = UserStatus.ONLINE;

			await manager.applyStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, true);

			expect((manager.setupAppointmentStatusChange as sinon.SinonStub).callCount).to.equal(1);
			expect((manager.setupAppointmentStatusChange as sinon.SinonStub).firstCall.args).to.deep.equal([
				fakeEventId,
				fakeUserId,
				fakeStartTime,
				fakeEndTime,
				previousStatus,
				false,
			]);
		});
	});

	describe('#cancelUpcomingStatusChanges', () => {
		it('should do nothing if busy status setting is disabled', async () => {
			settingsMock.get.returns(false);

			await manager.cancelUpcomingStatusChanges(fakeUserId);

			expect(CalendarEventMock.find.callCount).to.equal(0);
		});

		it('should find and cancel active events', async () => {
			const events = [
				{ _id: 'event1', uid: fakeUserId },
				{ _id: 'event2', uid: fakeUserId },
			];

			CalendarEventMock.find.returns({
				toArray: sinon.stub().resolves(events),
			} as any);

			cronJobsMock.has.resolves(true);

			await manager.cancelUpcomingStatusChanges(fakeUserId);

			expect(cronJobsMock.has.callCount).to.equal(2);
			expect(cronJobsMock.remove.callCount).to.equal(2);
		});
	});

	describe('#getShiftedTime', () => {
		it('should shift time forward by minutes', () => {
			const date = new Date('2025-01-01T10:00:00Z');
			const result = manager.getShiftedTime(date, 30);

			expect(result.getTime()).to.equal(new Date('2025-01-01T10:30:00Z').getTime());
			expect(date.getTime()).to.equal(new Date('2025-01-01T10:00:00Z').getTime());
		});

		it('should shift time backward by negative minutes', () => {
			const date = new Date('2025-01-01T10:00:00Z');
			const result = manager.getShiftedTime(date, -15);

			expect(result.getTime()).to.equal(new Date('2025-01-01T09:45:00Z').getTime());
		});
	});

	describe('statusEventManager export', () => {
		it('should export a singleton instance', () => {
			proxyquire.callThru();

			const { statusEventManager } = proxyquire.noCallThru().load('../../../../../server/services/calendar/statusEvents', {
				'../../../app/settings/server': { settings: settingsMock },
				'@rocket.chat/core-services': { api },
				'@rocket.chat/cron': { cronJobs: cronJobsMock },
				'@rocket.chat/models': { CalendarEvent: CalendarEventMock, Users: UsersMock },
			});

			expect(statusEventManager.constructor.name).to.equal('StatusEventManager');
		});
	});
});
