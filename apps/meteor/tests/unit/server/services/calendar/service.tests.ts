import { api } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import type { DeleteResult, UpdateResult } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { testPrivateMethod, createFreshServiceInstance } from '../utils';
import { MockedCronJobs } from './mocks/cronJobs';

const settingsMock = new Map<string, any>();
const cronJobsMock = new MockedCronJobs();

const CalendarEventMock = {
	insertOne: sinon.stub(),
	findOne: sinon.stub(),
	findByUserIdAndDate: sinon.stub(),
	updateEvent: sinon.stub(),
	deleteOne: sinon.stub(),
	findNextNotificationDate: sinon.stub(),
	findEventsToNotify: sinon.stub(),
	flagNotificationSent: sinon.stub(),
	findOneByExternalIdAndUserId: sinon.stub(),
	findNextFutureEvent: sinon.stub(),
	findOverlappingEvents: sinon.stub(),
	bulkUpsertImported: sinon.stub(),
	reopenNotifications: sinon.stub(),
	deleteUnfinishedByExternalIdsAndUserId: sinon.stub(),
	deleteImportedOutsideSet: sinon.stub(),
};

const PresenceMock = {
	setActiveState: sinon.stub().resolves(),
	endActiveState: sinon.stub().resolves(),
};

const UsersMock = {
	findOneById: sinon.stub().resolves({ language: 'en' }),
};

const getUserPreferenceMock = sinon.stub();

const LicenseMock = { hasModule: sinon.stub() };

const serviceMocks = {
	'../../settings': { settings: settingsMock },
	'@rocket.chat/core-services': {
		api,
		ServiceClassInternal: class {},
		Presence: PresenceMock,
	},
	'@rocket.chat/cron': { cronJobs: cronJobsMock },
	'@rocket.chat/models': { CalendarEvent: CalendarEventMock, Users: UsersMock },
	'@rocket.chat/license': { License: LicenseMock },
	'../../lib/utils/lib/getUserPreference': { getUserPreference: getUserPreferenceMock },
	'../../lib/i18n': { i18n: { t: sinon.stub().returns('Outlook: In a meeting') } },
};

const { CalendarService } = proxyquire.noCallThru().load('../../../../../server/services/calendar/service', serviceMocks);

describe('CalendarService', () => {
	let sandbox: sinon.SinonSandbox;
	let service: InstanceType<typeof CalendarService>;
	const fakeUserId = 'user123';
	const fakeEventId = 'event456';
	const fakeExternalId = 'external789';
	const fakeStartTime = new Date('2025-01-01T10:00:00Z');
	const fakeEndTime = new Date('2025-01-01T11:00:00Z');
	const fakeSubject = 'Test Meeting';
	const fakeDescription = 'This is a test meeting';
	const fakeMeetingUrl = 'https://meet.test/123';

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		service = new CalendarService();
		stubServiceMethods();
		setupCalendarEventMocks();
		setupPresenceMocks();
		setupOtherMocks();
	});

	function stubServiceMethods() {
		const proto = Object.getPrototypeOf(service);
		sandbox.stub(proto, 'parseDescriptionForMeetingUrl').resolves(fakeMeetingUrl);
		sandbox.stub(proto, 'findImportedEvent').callsFake(async (externalId, uid) => {
			return CalendarEventMock.findOneByExternalIdAndUserId(externalId, uid);
		});
		sandbox.stub(proto, 'sendEventNotification').resolves();
		sandbox.stub(proto, 'sendCurrentNotifications').resolves();
		sandbox.stub(proto, 'doSetupNextNotification').resolves();
		sandbox.stub(proto, 'doSetupNextStatusChange').resolves();

		sandbox.stub(service, 'setupNextNotification').resolves();
		sandbox.stub(service, 'setupNextStatusChange').resolves();
	}

	function setupCalendarEventMocks() {
		const freshMocks = {
			insertOne: sinon.stub().resolves({ insertedId: fakeEventId }),
			findOne: sinon.stub().resolves(null),
			findByUserIdAndDate: sinon.stub().returns({
				toArray: sinon.stub().resolves([]),
			}),
			updateEvent: sinon.stub().resolves({ modifiedCount: 1, matchedCount: 1 } as UpdateResult),
			deleteOne: sinon.stub().resolves({ deletedCount: 1 } as DeleteResult),
			findNextNotificationDate: sinon.stub().resolves(null),
			findEventsToNotify: sinon.stub().returns({
				toArray: sinon.stub().resolves([]),
			}),
			flagNotificationSent: sinon.stub().resolves(),
			findOneByExternalIdAndUserId: sinon.stub().resolves(null),
			findNextFutureEvent: sinon.stub().resolves(null),
			findOverlappingEvents: sinon.stub().returns({
				next: sinon.stub().resolves(null),
				toArray: sinon.stub().resolves([]),
			}),
			bulkUpsertImported: sinon.stub().resolves({ upsertedCount: 0, modifiedCount: 0, matchedCount: 0 }),
			reopenNotifications: sinon.stub().resolves({ modifiedCount: 0 }),
			deleteUnfinishedByExternalIdsAndUserId: sinon.stub().resolves({ deletedCount: 0 }),
			deleteImportedOutsideSet: sinon.stub().resolves({ deletedCount: 0 }),
		};

		Object.assign(CalendarEventMock, freshMocks);
	}

	function setupPresenceMocks() {
		PresenceMock.setActiveState.resetHistory();
		PresenceMock.endActiveState.resetHistory();
		UsersMock.findOneById.resetHistory();
		UsersMock.findOneById.resolves({ language: 'en' });
	}

	function setupOtherMocks() {
		sandbox.stub(api, 'broadcast').resolves();

		settingsMock.clear();
		settingsMock.set(
			'Calendar_MeetingUrl_Regex',
			'(?:[?&]callUrl=([^\n&<]+))|(?:(?:%3F)|(?:%26))callUrl(?:%3D)((?:(?:[^\n&<](?!%26)))+[^\n&<]?)',
		);
		settingsMock.set('Calendar_BusyStatus_Enabled', true);

		cronJobsMock.jobNames.clear();

		getUserPreferenceMock.reset();
		getUserPreferenceMock.resolves(true);

		LicenseMock.hasModule.reset();
		LicenseMock.hasModule.returns(true);
	}

	afterEach(() => {
		sandbox.restore();
	});

	describe('#create', () => {
		it('should create a new calendar event', async () => {
			const eventData = {
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				subject: fakeSubject,
				description: fakeDescription,
				meetingUrl: fakeMeetingUrl,
				reminderMinutesBeforeStart: 5,
			};

			const result = await service.create(eventData);

			expect(result).to.equal(fakeEventId);
			expect(CalendarEventMock.insertOne.callCount).to.equal(1);
			expect(CalendarEventMock.insertOne.firstCall.args[0]).to.include({
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
				description: fakeDescription,
				meetingUrl: fakeMeetingUrl,
				reminderMinutesBeforeStart: 5,
				notificationSent: false,
			});
			sinon.assert.calledOnce(service.setupNextStatusChange);
		});
	});

	describe('#import', () => {
		it('should create a new event if externalId is not provided', async () => {
			const eventData = {
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
				description: fakeDescription,
			};

			await service.import(eventData);

			sinon.assert.calledOnce(CalendarEventMock.insertOne);
			sinon.assert.calledOnce(service.setupNextStatusChange);
		});

		it('should update existing event if found by externalId', async () => {
			const eventData = {
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
				description: fakeDescription,
				externalId: fakeExternalId,
			};

			CalendarEventMock.findOneByExternalIdAndUserId.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				externalId: fakeExternalId,
			});

			await service.import(eventData);

			sinon.assert.calledWith(CalendarEventMock.findOneByExternalIdAndUserId, fakeExternalId, fakeUserId);
			sinon.assert.calledOnce(CalendarEventMock.updateEvent);
			sinon.assert.notCalled(CalendarEventMock.insertOne);
		});
	});

	describe('#update', () => {
		it('should update an existing event', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);

			const updateData = {
				subject: 'Updated Subject',
				description: 'Updated Description',
			};

			await service.update(fakeEventId, updateData);

			sinon.assert.calledWith(CalendarEventMock.updateEvent, fakeEventId, sinon.match.has('subject', 'Updated Subject'));
		});

		it('should reschedule the status change when start/end times change', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);

			const newStartTime = new Date('2025-01-02T10:00:00Z');
			const newEndTime = new Date('2025-01-02T11:00:00Z');

			await service.update(fakeEventId, {
				startTime: newStartTime,
				endTime: newEndTime,
			});

			sinon.assert.calledOnce(service.setupNextStatusChange);
		});
	});

	describe('#delete', () => {
		it('should delete an event', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);

			await service.delete(fakeEventId);

			sinon.assert.calledWith(CalendarEventMock.deleteOne, { _id: fakeEventId });
		});

		it('should lower the busy expiry to the remaining active event when deleting an overlapping in-progress event', async () => {
			const t = Date.now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t - 60 * 1000),
				endTime: new Date(t + 120 * 60 * 1000),
			});
			CalendarEventMock.findOverlappingEvents.returns({
				next: sinon.stub().resolves(null),
				toArray: sinon.stub().resolves([{ _id: 'remaining', endTime: new Date(t + 30 * 60 * 1000) }]),
			});

			await service.delete(fakeEventId);

			sinon.assert.calledOnce(PresenceMock.setActiveState);
			sinon.assert.notCalled(PresenceMock.endActiveState);
			const [uid, state] = PresenceMock.setActiveState.firstCall.args;
			expect(uid).to.equal(fakeUserId);
			expect(state.statusExpiresAt.getTime()).to.equal(t + 30 * 60 * 1000);
		});

		it('should end the busy state when deleting the only active in-progress event', async () => {
			const t = Date.now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t - 60 * 1000),
				endTime: new Date(t + 60 * 60 * 1000),
			});
			CalendarEventMock.findOverlappingEvents.returns({
				next: sinon.stub().resolves(null),
				toArray: sinon.stub().resolves([]),
			});

			await service.delete(fakeEventId);

			sinon.assert.calledOnceWithExactly(PresenceMock.endActiveState, fakeUserId, 'calendar');
			sinon.assert.notCalled(PresenceMock.setActiveState);
		});

		it('should not touch presence when deleting an event that is not in progress', async () => {
			const t = Date.now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t + 60 * 60 * 1000),
				endTime: new Date(t + 120 * 60 * 1000),
			});

			await service.delete(fakeEventId);

			sinon.assert.notCalled(PresenceMock.endActiveState);
			sinon.assert.notCalled(PresenceMock.setActiveState);
		});
	});

	describe('#setupNextNotification', () => {
		it('should call doSetupNextNotification internally', async () => {
			const serviceExports = proxyquire.noCallThru().load('../../../../../server/services/calendar/service', serviceMocks);

			const testService = createFreshServiceInstance<InstanceType<typeof CalendarService>>(serviceExports);

			const localSandbox = sinon.createSandbox();

			try {
				const doSetupStub = localSandbox.stub(Object.getPrototypeOf(testService), 'doSetupNextNotification').resolves();

				await testService.setupNextNotification();

				sinon.assert.calledOnceWithExactly(doSetupStub, false);
			} finally {
				localSandbox.restore();
			}
		});
	});

	describe('Private: parseDescriptionForMeetingUrl', () => {
		it('should extract URL from description with default pattern', async () => {
			await testPrivateMethod(service, 'parseDescriptionForMeetingUrl', async (method) => {
				const testDescription = 'Join at https://meet.example.com?callUrl=https://special-meeting.com/123';
				const result = await method(testDescription);
				expect(result).to.equal('https://special-meeting.com/123');
			});
		});
	});

	describe('Private: doSetupNextNotification', () => {
		it('should schedule notifications at the next date', async () => {
			await testPrivateMethod(service, 'doSetupNextNotification', async (method) => {
				const nextDate = new Date('2025-01-01T10:00:00Z');
				CalendarEventMock.findNextNotificationDate.resolves(nextDate);

				await method(false);

				expect(cronJobsMock.jobNames.has('calendar-reminders')).to.true;
			});
		});
	});

	describe('Private: doSetupNextStatusChange', () => {
		it('should not run when busy status setting is disabled', async () => {
			await testPrivateMethod(service, 'doSetupNextStatusChange', async (method) => {
				settingsMock.set('Calendar_BusyStatus_Enabled', false);

				const originalHas = cronJobsMock.has;
				const originalRemove = cronJobsMock.remove;
				const originalAddAtTimestamp = cronJobsMock.addAtTimestamp;

				const hasStub = sinon.stub().resolves(true);
				const removeStub = sinon.stub().resolves();
				const addAtTimestampStub = sinon.stub().resolves();

				cronJobsMock.has = hasStub;
				cronJobsMock.remove = removeStub;
				cronJobsMock.addAtTimestamp = addAtTimestampStub;

				try {
					await method();
					sinon.assert.calledWith(hasStub, 'calendar-status-scheduler');
					sinon.assert.calledWith(removeStub, 'calendar-status-scheduler');
					sinon.assert.notCalled(addAtTimestampStub);
				} finally {
					cronJobsMock.has = originalHas;
					cronJobsMock.remove = originalRemove;
					cronJobsMock.addAtTimestamp = originalAddAtTimestamp;
				}
			});
		});

		it('should schedule a job at the next event start time', async () => {
			await testPrivateMethod(service, 'doSetupNextStatusChange', async (method) => {
				settingsMock.set('Calendar_BusyStatus_Enabled', true);

				const futureEvent = {
					_id: 'future123',
					uid: fakeUserId,
					startTime: new Date(Date.now() + 60000),
					endTime: new Date(Date.now() + 3660000),
				};

				CalendarEventMock.findNextFutureEvent.resolves(futureEvent);

				const originalHas = cronJobsMock.has;
				const originalRemove = cronJobsMock.remove;
				const originalAddAtTimestamp = cronJobsMock.addAtTimestamp;

				const hasStub = sinon.stub().resolves(false);
				const removeStub = sinon.stub().resolves();
				const addAtTimestampStub = sinon.stub().resolves();

				cronJobsMock.has = hasStub;
				cronJobsMock.remove = removeStub;
				cronJobsMock.addAtTimestamp = addAtTimestampStub;

				try {
					await method();

					sinon.assert.calledOnce(addAtTimestampStub);
					sinon.assert.calledWith(addAtTimestampStub, 'calendar-status-scheduler', futureEvent.startTime, sinon.match.func);
				} finally {
					cronJobsMock.has = originalHas;
					cronJobsMock.remove = originalRemove;
					cronJobsMock.addAtTimestamp = originalAddAtTimestamp;
				}
			});
		});

		it('should not schedule a job when there are no future events', async () => {
			await testPrivateMethod(service, 'doSetupNextStatusChange', async (method) => {
				settingsMock.set('Calendar_BusyStatus_Enabled', true);

				CalendarEventMock.findNextFutureEvent.resolves(null);

				const originalHas = cronJobsMock.has;
				const originalRemove = cronJobsMock.remove;
				const originalAddAtTimestamp = cronJobsMock.addAtTimestamp;

				const hasStub = sinon.stub().resolves(false);
				const removeStub = sinon.stub().resolves();
				const addAtTimestampStub = sinon.stub().resolves();

				cronJobsMock.has = hasStub;
				cronJobsMock.remove = removeStub;
				cronJobsMock.addAtTimestamp = addAtTimestampStub;

				try {
					await method();

					sinon.assert.notCalled(addAtTimestampStub);
				} finally {
					cronJobsMock.has = originalHas;
					cronJobsMock.remove = originalRemove;
					cronJobsMock.addAtTimestamp = originalAddAtTimestamp;
				}
			});
		});
	});

	describe('Private: processEventStart', () => {
		// await directly: testPrivateMethod doesn't await its callback, so async assertions wouldn't fail
		const callProcessEventStart = (event: unknown) => (service as any).processEventStart(event);

		it('should set statusExpiresAt to the latest endTime among overlapping active events', async () => {
			const now = Date.now();
			const event = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(now - 1000),
				endTime: new Date(now + 60 * 60 * 1000),
			};

			CalendarEventMock.findOverlappingEvents.returns({
				next: sinon.stub().resolves(null),
				toArray: sinon.stub().resolves([
					{ _id: 'later', endTime: new Date(now + 120 * 60 * 1000) },
					{ _id: 'earlier', endTime: new Date(now + 30 * 60 * 1000) },
				]),
			});

			await callProcessEventStart(event);

			sinon.assert.calledOnce(PresenceMock.setActiveState);
			const [uid, state] = PresenceMock.setActiveState.firstCall.args;
			expect(uid).to.equal(fakeUserId);
			expect(state.statusSource).to.equal('external');
			expect(state.statusExpiresAt.getTime()).to.equal(now + 120 * 60 * 1000);
			expect(state.statusId).to.equal('calendar');
			expect(state.statusText).to.equal('Outlook: In a meeting');
		});

		it('should use the event own endTime when there are no overlapping events', async () => {
			const now = Date.now();
			const endTime = new Date(now + 60 * 60 * 1000);
			const event = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(now - 1000),
				endTime,
			};

			await callProcessEventStart(event);

			sinon.assert.calledOnce(PresenceMock.setActiveState);
			const [, state] = PresenceMock.setActiveState.firstCall.args;
			expect(state.statusExpiresAt.getTime()).to.equal(endTime.getTime());
		});

		it('should not apply busy status when the event has no endTime', async () => {
			const event = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(),
			};

			await callProcessEventStart(event);

			sinon.assert.notCalled(PresenceMock.setActiveState);
		});
	});

	describe('Private: reconcileInProgressEvent', () => {
		const callReconcile = (eventId: string) => (service as any).reconcileInProgressEvent(eventId);
		const now = () => Date.now();

		it('applies the busy claim for an in-progress event using its endTime', async () => {
			const t = now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t - 60 * 1000),
				endTime: new Date(t + 60 * 60 * 1000),
			});

			await callReconcile(fakeEventId);

			sinon.assert.calledOnce(PresenceMock.setActiveState);
			sinon.assert.notCalled(PresenceMock.endActiveState);
			const [uid, state] = PresenceMock.setActiveState.firstCall.args;
			expect(uid).to.equal(fakeUserId);
			expect(state.statusSource).to.equal('external');
			expect(state.statusExpiresAt.getTime()).to.equal(t + 60 * 60 * 1000);
		});

		it('extends the busy claim to the latest end among overlapping in-progress events', async () => {
			const t = now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t - 60 * 1000),
				endTime: new Date(t + 30 * 60 * 1000),
			});
			CalendarEventMock.findOverlappingEvents.returns({
				next: sinon.stub().resolves(null),
				toArray: sinon.stub().resolves([{ _id: 'longer', endTime: new Date(t + 90 * 60 * 1000) }]),
			});

			await callReconcile(fakeEventId);

			sinon.assert.calledOnce(PresenceMock.setActiveState);
			const [, state] = PresenceMock.setActiveState.firstCall.args;
			expect(state.statusExpiresAt.getTime()).to.equal(t + 90 * 60 * 1000);
		});

		it('does nothing for an event that has not started yet', async () => {
			const t = now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t + 60 * 60 * 1000),
				endTime: new Date(t + 120 * 60 * 1000),
			});

			await callReconcile(fakeEventId);

			sinon.assert.notCalled(PresenceMock.setActiveState);
			sinon.assert.notCalled(PresenceMock.endActiveState);
		});

		it('does nothing for an event that has already ended', async () => {
			const t = now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t - 120 * 60 * 1000),
				endTime: new Date(t - 60 * 60 * 1000),
			});

			await callReconcile(fakeEventId);

			sinon.assert.notCalled(PresenceMock.setActiveState);
			sinon.assert.notCalled(PresenceMock.endActiveState);
		});

		it('does nothing for a non-busy event', async () => {
			const t = now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t - 60 * 1000),
				endTime: new Date(t + 60 * 60 * 1000),
				busy: false,
			});

			await callReconcile(fakeEventId);

			sinon.assert.notCalled(PresenceMock.setActiveState);
			sinon.assert.notCalled(PresenceMock.endActiveState);
		});

		it('does nothing when busy status is disabled', async () => {
			settingsMock.set('Calendar_BusyStatus_Enabled', false);
			const t = now();
			CalendarEventMock.findOne.resolves({
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: new Date(t - 60 * 1000),
				endTime: new Date(t + 60 * 60 * 1000),
			});

			await callReconcile(fakeEventId);

			sinon.assert.notCalled(PresenceMock.setActiveState);
			sinon.assert.notCalled(PresenceMock.endActiveState);
		});
	});

	describe('#importMany', () => {
		const imported = (over: Record<string, unknown> = {}) => ({
			uid: fakeUserId,
			externalId: fakeExternalId,
			subject: fakeSubject,
			description: fakeDescription,
			startTime: fakeStartTime,
			endTime: fakeEndTime,
			busy: true,
			...over,
		});

		it('skips an event with no externalId, which would be inserted again on every run', async () => {
			const result = await service.importMany([imported(), imported({ externalId: undefined })], { deferSideEffects: true });

			expect(result.skipped).to.equal(1);
			expect(CalendarEventMock.bulkUpsertImported.firstCall.args[0]).to.have.lengthOf(1);
			expect(CalendarEventMock.bulkUpsertImported.firstCall.args[0][0]).to.include({ externalId: fakeExternalId });
		});

		it('derives the reminder time from the start time and the lead minutes', async () => {
			await service.importMany([imported({ reminderMinutesBeforeStart: 15 })], { deferSideEffects: true });

			expect(CalendarEventMock.bulkUpsertImported.firstCall.args[0][0].reminderTime).to.deep.equal(new Date('2025-01-01T09:45:00Z'));
		});

		it('leaves the reminder time unset when the event carries no lead minutes', async () => {
			await service.importMany([imported()], { deferSideEffects: true });

			expect(CalendarEventMock.bulkUpsertImported.firstCall.args[0][0].reminderTime).to.equal(undefined);
		});

		it('counts a reopened notification as a modification, so the run reports it as changed', async () => {
			CalendarEventMock.reopenNotifications.resolves({ modifiedCount: 2 });

			const result = await service.importMany([imported()], { deferSideEffects: true });

			expect(result).to.include({ changed: true, modified: 2 });
		});

		it('reports no change when nothing was written', async () => {
			const result = await service.importMany([imported()], { deferSideEffects: true });

			expect(result.changed).to.equal(false);
		});

		it('does nothing to presence while side effects are deferred', async () => {
			CalendarEventMock.bulkUpsertImported.resolves({ upsertedCount: 1, modifiedCount: 0, matchedCount: 0 });

			await service.importMany([imported()], { deferSideEffects: true });

			sinon.assert.notCalled(CalendarEventMock.findOverlappingEvents);
		});

		it('updates presence when side effects are not deferred', async () => {
			CalendarEventMock.bulkUpsertImported.resolves({ upsertedCount: 1, modifiedCount: 0, matchedCount: 0 });

			await service.importMany([imported()], { deferSideEffects: false });

			sinon.assert.called(CalendarEventMock.findOverlappingEvents);
		});
	});

	describe('#deleteImported', () => {
		it('does not query at all for an empty list', async () => {
			const result = await service.deleteImported(fakeUserId, [], fakeStartTime, { deferSideEffects: true });

			sinon.assert.notCalled(CalendarEventMock.deleteUnfinishedByExternalIdsAndUserId);
			expect(result).to.include({ changed: false, deleted: 0 });
		});

		it('passes the floor through, which is what keeps earlier days out of reach', async () => {
			await service.deleteImported(fakeUserId, [fakeExternalId], fakeStartTime, { deferSideEffects: true });

			sinon.assert.calledWith(CalendarEventMock.deleteUnfinishedByExternalIdsAndUserId, fakeUserId, [fakeExternalId], fakeStartTime);
		});

		it('refreshes presence only when something was actually removed', async () => {
			CalendarEventMock.deleteUnfinishedByExternalIdsAndUserId.resolves({ deletedCount: 3 });

			await service.deleteImported(fakeUserId, [fakeExternalId], fakeStartTime, { deferSideEffects: false });

			sinon.assert.called(PresenceMock.endActiveState);
		});
	});

	describe('#pruneImportedWindow', () => {
		const timeWindow = { start: fakeStartTime, end: fakeEndTime };

		it('refreshes presence with the removal gate on once it removed something', async () => {
			CalendarEventMock.deleteImportedOutsideSet.resolves({ deletedCount: 1 });

			await service.pruneImportedWindow(fakeUserId, timeWindow, []);

			sinon.assert.calledWith(PresenceMock.endActiveState, fakeUserId, 'calendar');
		});

		it('touches nothing when it removed nothing', async () => {
			await service.pruneImportedWindow(fakeUserId, timeWindow, []);

			sinon.assert.notCalled(PresenceMock.endActiveState);
		});
	});

	describe('#refreshBusyPresence', () => {
		const inProgress = (endTime: Date) => ({
			uid: fakeUserId,
			externalId: fakeExternalId,
			subject: fakeSubject,
			startTime: fakeStartTime,
			endTime,
			busy: true,
		});

		it('ends the claim after a removal when nothing is in progress any more', async () => {
			await service.refreshBusyPresence(fakeUserId, { removedEvents: true });

			sinon.assert.calledWith(PresenceMock.endActiveState, fakeUserId, 'calendar');
		});

		it('sets the claim after an upsert-only pass when an event is in progress', async () => {
			CalendarEventMock.findOverlappingEvents.returns({ toArray: sinon.stub().resolves([inProgress(fakeEndTime)]) });

			await service.refreshBusyPresence(fakeUserId);

			expect(PresenceMock.setActiveState.firstCall.args[1]).to.include({ statusDefault: 'busy' });
		});

		it('expires the claim at the latest end time among the events in progress', async () => {
			const later = new Date('2025-01-01T12:30:00Z');
			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([inProgress(fakeEndTime), inProgress(later)]),
			});

			await service.refreshBusyPresence(fakeUserId, { removedEvents: true });

			expect(PresenceMock.setActiveState.firstCall.args[1]).to.deep.include({ statusExpiresAt: later });
		});

		it('does nothing at all while busy status is disabled', async () => {
			settingsMock.set('Calendar_BusyStatus_Enabled', false);
			CalendarEventMock.findOverlappingEvents.returns({ toArray: sinon.stub().resolves([inProgress(fakeEndTime)]) });

			await service.refreshBusyPresence(fakeUserId, { removedEvents: true });

			sinon.assert.notCalled(PresenceMock.setActiveState);
			sinon.assert.notCalled(PresenceMock.endActiveState);
		});
	});

	describe('#list', () => {
		it('hands the caller decision about imported events down to the query', async () => {
			await service.list(fakeUserId, fakeStartTime, { excludeImported: true });

			sinon.assert.calledWith(CalendarEventMock.findByUserIdAndDate, fakeUserId, fakeStartTime, { excludeImported: true });
		});
	});

	describe('Private: sendEventNotification', () => {
		const reminder = (over: Record<string, unknown> = {}) => ({
			_id: fakeEventId,
			uid: fakeUserId,
			subject: fakeSubject,
			startTime: fakeStartTime,
			...over,
		});

		beforeEach(() => {
			service.sendEventNotification.restore();
		});

		it('delivers a reminder for an event the user created, licensed or not', async () => {
			LicenseMock.hasModule.returns(false);

			await service.sendEventNotification(reminder());

			sinon.assert.called(api.broadcast as sinon.SinonStub);
		});

		it('holds back a reminder for an imported event once the license is gone', async () => {
			LicenseMock.hasModule.returns(false);

			await service.sendEventNotification(reminder({ externalId: fakeExternalId }));

			sinon.assert.notCalled(api.broadcast as sinon.SinonStub);
		});

		it('delivers a reminder for an imported event while the license is there', async () => {
			LicenseMock.hasModule.returns(true);

			await service.sendEventNotification(reminder({ externalId: fakeExternalId }));

			sinon.assert.called(api.broadcast as sinon.SinonStub);
		});
	});
});
