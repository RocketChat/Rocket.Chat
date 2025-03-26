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
	findEventsToScheduleNow: sinon.stub(),
	findNextFutureEvent: sinon.stub(),
	findInProgressEvents: sinon.stub(),
};

const UsersMock = {
	findOne: sinon.stub(),
};

const statusEventManagerMock = {
	removeCronJobs: sinon.stub().resolves(),
	cancelUpcomingStatusChanges: sinon.stub().resolves(),
	applyStatusChange: sinon.stub().resolves(),
};

const getUserPreferenceMock = sinon.stub();

const serviceMocks = {
	'./statusEvents/cancelUpcomingStatusChanges': { cancelUpcomingStatusChanges: statusEventManagerMock.cancelUpcomingStatusChanges },
	'./statusEvents/removeCronJobs': { removeCronJobs: statusEventManagerMock.removeCronJobs },
	'./statusEvents/applyStatusChange': { applyStatusChange: statusEventManagerMock.applyStatusChange },
	'../../../app/settings/server': { settings: settingsMock },
	'@rocket.chat/core-services': { api, ServiceClassInternal: class {} },
	'@rocket.chat/cron': { cronJobs: cronJobsMock },
	'@rocket.chat/models': { CalendarEvent: CalendarEventMock, Users: UsersMock },
	'../../../app/utils/server/lib/getUserPreference': { getUserPreference: getUserPreferenceMock },
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
		setupStatusEventManagerMocks();
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
			findEventsToScheduleNow: sinon.stub().returns({
				toArray: sinon.stub().resolves([]),
			}),
			findNextFutureEvent: sinon.stub().resolves(null),
			findInProgressEvents: sinon.stub().returns({
				toArray: sinon.stub().resolves([]),
			}),
		};

		Object.assign(CalendarEventMock, freshMocks);
	}

	function setupStatusEventManagerMocks() {
		Object.values(statusEventManagerMock).forEach((stub) => stub.resetHistory());
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

		it('should update cron jobs when start/end times change', async () => {
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

			sinon.assert.calledOnce(statusEventManagerMock.removeCronJobs);
			sinon.assert.calledOnce(service.setupNextStatusChange);
		});
	});

	describe('#delete', () => {
		it('should delete an event and remove cron jobs', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);

			await service.delete(fakeEventId);

			sinon.assert.calledOnce(statusEventManagerMock.removeCronJobs);
			sinon.assert.calledWith(CalendarEventMock.deleteOne, { _id: fakeEventId });
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
					sinon.assert.calledWith(hasStub, 'calendar-next-status-change');
					sinon.assert.calledWith(removeStub, 'calendar-next-status-change');
					sinon.assert.notCalled(addAtTimestampStub);
				} finally {
					cronJobsMock.has = originalHas;
					cronJobsMock.remove = originalRemove;
					cronJobsMock.addAtTimestamp = originalAddAtTimestamp;
				}
			});
		});

		it('should schedule a single chain job to handle all events when busy status setting is enabled', async () => {
			await testPrivateMethod(service, 'doSetupNextStatusChange', async (method) => {
				settingsMock.set('Calendar_BusyStatus_Enabled', true);

				const startOfNextMinute = new Date();
				startOfNextMinute.setSeconds(0, 0);
				startOfNextMinute.setMinutes(startOfNextMinute.getMinutes() + 1);

				const endOfNextMinute = new Date(startOfNextMinute);
				endOfNextMinute.setMinutes(startOfNextMinute.getMinutes() + 1);

				const eventStartingSoon = {
					_id: 'soon123',
					uid: fakeUserId,
					startTime: startOfNextMinute,
					endTime: new Date(startOfNextMinute.getTime() + 3600000), // 1 hour later
				};

				const futureEvent = {
					_id: 'future123',
					uid: fakeUserId,
					startTime: endOfNextMinute,
					endTime: new Date(endOfNextMinute.getTime() + 3600000), // 1 hour later
				};

				CalendarEventMock.findEventsToScheduleNow.returns({
					toArray: sinon.stub().resolves([eventStartingSoon]),
				});
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

					sinon.assert.calledWith(hasStub, 'calendar-next-status-change');
					sinon.assert.notCalled(removeStub);

					sinon.assert.calledOnce(addAtTimestampStub);

					sinon.assert.calledWith(addAtTimestampStub, 'calendar-next-status-change', futureEvent.startTime, sinon.match.func);

					sinon.assert.neverCalledWith(addAtTimestampStub, sinon.match(/^calendar-status-/), sinon.match.any, sinon.match.any);
				} finally {
					cronJobsMock.has = originalHas;
					cronJobsMock.remove = originalRemove;
					cronJobsMock.addAtTimestamp = originalAddAtTimestamp;
				}
			});
		});

		it('should fetch events at execution time rather than scheduling them individually', async () => {
			await testPrivateMethod(service, 'doSetupNextStatusChange', async (method) => {
				settingsMock.set('Calendar_BusyStatus_Enabled', true);

				const now = new Date();
				const startOfNextMinute = new Date(now);
				startOfNextMinute.setSeconds(0, 0);
				startOfNextMinute.setMinutes(startOfNextMinute.getMinutes() + 1);

				const endOfNextMinute = new Date(startOfNextMinute);
				endOfNextMinute.setMinutes(startOfNextMinute.getMinutes() + 1);

				CalendarEventMock.findEventsToScheduleNow.returns({
					toArray: sinon.stub().resolves([]),
				});
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

					sinon.assert.calledWith(addAtTimestampStub, 'calendar-next-status-change', endOfNextMinute, sinon.match.func);

					const callback = addAtTimestampStub.firstCall.args[2];
					const doSetupNextStatusChangeStub = sinon.stub(service, 'doSetupNextStatusChange').resolves();
					await callback();

					sinon.assert.calledOnce(doSetupNextStatusChangeStub);
					doSetupNextStatusChangeStub.restore();
				} finally {
					cronJobsMock.has = originalHas;
					cronJobsMock.remove = originalRemove;
					cronJobsMock.addAtTimestamp = originalAddAtTimestamp;
				}
			});
		});
	});

	describe('Overlapping events', () => {
		it('should cancel upcoming status changes for a user', async () => {
			const customDate = new Date('2025-02-01');

			await service.cancelUpcomingStatusChanges(fakeUserId, customDate);

			sinon.assert.calledOnce(statusEventManagerMock.cancelUpcomingStatusChanges);
			sinon.assert.calledWith(statusEventManagerMock.cancelUpcomingStatusChanges, fakeUserId, customDate);
		});
	});
});
