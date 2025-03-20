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
};

const statusEventManagerMock = {
	setupAppointmentStatusChange: sinon.stub().resolves(),
	removeCronJobs: sinon.stub().resolves(),
	cancelUpcomingStatusChanges: sinon.stub().resolves(),
};

const getUserPreferenceMock = sinon.stub();

const serviceMocks = {
	'./statusEvents/cancelUpcomingStatusChanges': { cancelUpcomingStatusChanges: statusEventManagerMock.cancelUpcomingStatusChanges },
	'./statusEvents/removeCronJobs': { removeCronJobs: statusEventManagerMock.removeCronJobs },
	'./statusEvents/setupAppointmentStatusChange': { setupAppointmentStatusChange: statusEventManagerMock.setupAppointmentStatusChange },
	'../../../app/settings/server': { settings: settingsMock },
	'@rocket.chat/core-services': { api, ServiceClassInternal: class {} },
	'@rocket.chat/cron': { cronJobs: cronJobsMock },
	'@rocket.chat/models': { CalendarEvent: CalendarEventMock },
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

		sandbox.stub(service, 'setupNextNotification').resolves();
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
			sinon.assert.calledOnce(statusEventManagerMock.setupAppointmentStatusChange);
		});

		it('should create event without end time if not provided', async () => {
			const eventData = {
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
				description: fakeDescription,
			};

			await service.create(eventData);

			expect(CalendarEventMock.insertOne.firstCall.args[0]).to.not.have.property('endTime');
		});

		it('should use default reminder minutes if not provided', async () => {
			const eventData = {
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
				description: fakeDescription,
			};

			await service.create(eventData);

			const insertedData = CalendarEventMock.insertOne.firstCall.args[0];
			expect(insertedData).to.have.property('reminderMinutesBeforeStart', 5);
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
			sinon.assert.calledOnce(statusEventManagerMock.setupAppointmentStatusChange);
		});

		it('should create a new event if event with externalId not found', async () => {
			const eventData = {
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
				description: fakeDescription,
				externalId: fakeExternalId,
			};

			CalendarEventMock.findOneByExternalIdAndUserId.resolves(null);

			await service.import(eventData);

			sinon.assert.calledWith(CalendarEventMock.findOneByExternalIdAndUserId, fakeExternalId, fakeUserId);
			sinon.assert.calledOnce(CalendarEventMock.insertOne);
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

		it('should extract meeting URL from description if not provided', async () => {
			const eventData = {
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
				description: 'Description with callUrl=https://meet.test/123',
				externalId: fakeExternalId,
			};

			const proto = Object.getPrototypeOf(service);
			await service.import(eventData);

			sinon.assert.calledWith(proto.parseDescriptionForMeetingUrl as sinon.SinonStub, eventData.description);
		});
	});

	describe('#get', () => {
		it('should retrieve a single event by ID', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);

			const result = await service.get(fakeEventId);

			sinon.assert.calledWith(CalendarEventMock.findOne, { _id: fakeEventId });
			expect(result).to.equal(fakeEvent);
		});
	});

	describe('#list', () => {
		it('should retrieve events for a user on a specific date', async () => {
			const fakeEvents = [
				{ _id: 'event1', uid: fakeUserId, startTime: fakeStartTime },
				{ _id: 'event2', uid: fakeUserId, startTime: fakeStartTime },
			];

			CalendarEventMock.findByUserIdAndDate.returns({
				toArray: sinon.stub().resolves(fakeEvents),
			});

			const fakeDate = new Date('2025-01-01');
			const result = await service.list(fakeUserId, fakeDate);

			sinon.assert.calledWith(CalendarEventMock.findByUserIdAndDate, fakeUserId, fakeDate);
			expect(result).to.equal(fakeEvents);
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

		it('should do nothing if event not found', async () => {
			CalendarEventMock.findOne.resolves(null);

			await service.update(fakeEventId, { subject: 'New Subject' });

			sinon.assert.notCalled(CalendarEventMock.updateEvent);
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
			sinon.assert.calledOnce(statusEventManagerMock.setupAppointmentStatusChange);
		});

		it('should extract meeting URL from description if not provided', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);

			const proto = Object.getPrototypeOf(service);

			await service.update(fakeEventId, {
				description: 'Description with callUrl=https://meet.test/123',
			});

			sinon.assert.called(proto.parseDescriptionForMeetingUrl as sinon.SinonStub);
		});

		it('should setup next notification if event was modified', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);
			CalendarEventMock.updateEvent.resolves({ modifiedCount: 1 } as UpdateResult);

			await service.update(fakeEventId, { subject: 'New Subject' });

			sinon.assert.calledOnce(service.setupNextNotification as sinon.SinonStub);
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

		it('should only delete the event if not found', async () => {
			CalendarEventMock.findOne.resolves(null);

			await service.delete(fakeEventId);

			sinon.assert.notCalled(statusEventManagerMock.removeCronJobs);
			sinon.assert.calledOnce(CalendarEventMock.deleteOne);
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

	describe('#cancelUpcomingStatusChanges', () => {
		it('should delegate to statusEventManager', async () => {
			await service.cancelUpcomingStatusChanges(fakeUserId);

			sinon.assert.calledWith(statusEventManagerMock.cancelUpcomingStatusChanges, fakeUserId);
		});

		it('should pass custom end time if provided', async () => {
			const customDate = new Date('2025-02-01');

			await service.cancelUpcomingStatusChanges(fakeUserId, customDate);

			sinon.assert.calledWith(statusEventManagerMock.cancelUpcomingStatusChanges, fakeUserId, customDate);
		});
	});

	describe('Private: parseDescriptionForMeetingUrl', () => {
		it('should return undefined for empty description', async () => {
			await testPrivateMethod(service, 'parseDescriptionForMeetingUrl', async (method) => {
				const result = await method('');
				expect(result).to.be.undefined;
			});
		});

		it('should extract URL from description with default pattern', async () => {
			await testPrivateMethod(service, 'parseDescriptionForMeetingUrl', async (method) => {
				const testDescription = 'Join at https://meet.example.com?callUrl=https://special-meeting.com/123';
				const result = await method(testDescription);
				expect(result).to.equal('https://special-meeting.com/123');
			});
		});

		it('should return undefined if regex pattern is empty', async () => {
			await testPrivateMethod(service, 'parseDescriptionForMeetingUrl', async (method) => {
				settingsMock.set('Calendar_MeetingUrl_Regex', '');

				const result = await method('Test description with no pattern match');
				expect(result).to.be.undefined;
			});
		});

		it('should handle URL decoding', async () => {
			await testPrivateMethod(service, 'parseDescriptionForMeetingUrl', async (method) => {
				const encodedUrl = 'Join meeting at link with callUrl%3Dhttps%3A%2F%2Fmeeting.example.com%2F123';
				const result = await method(encodedUrl);
				expect(result).to.include('https://meeting.example.com/123');
			});
		});
	});

	describe('Private: findImportedEvent', () => {
		it('should call the model method with correct parameters', async () => {
			await testPrivateMethod(service, 'findImportedEvent', async (method) => {
				await method(fakeExternalId, fakeUserId);
				sinon.assert.calledWith(CalendarEventMock.findOneByExternalIdAndUserId, fakeExternalId, fakeUserId);
			});
		});

		it('should return the event when found', async () => {
			await testPrivateMethod(service, 'findImportedEvent', async (method) => {
				const fakeEvent = { _id: fakeEventId, externalId: fakeExternalId, uid: fakeUserId };
				CalendarEventMock.findOneByExternalIdAndUserId.resolves(fakeEvent);

				const result = await method(fakeExternalId, fakeUserId);
				expect(result).to.equal(fakeEvent);
			});
		});

		it('should return null when event not found', async () => {
			await testPrivateMethod(service, 'findImportedEvent', async (method) => {
				CalendarEventMock.findOneByExternalIdAndUserId.resolves(null);

				const result = await method(fakeExternalId, fakeUserId);
				expect(result).to.be.null;
			});
		});
	});

	describe('Private: sendEventNotification', () => {
		it('should not send notification if user preference is disabled', async () => {
			await testPrivateMethod(service, 'sendEventNotification', async (method) => {
				getUserPreferenceMock.resolves(false);

				const fakeEvent = {
					_id: fakeEventId,
					uid: fakeUserId,
					startTime: fakeStartTime,
					subject: fakeSubject,
				};

				await method(fakeEvent);

				sinon.assert.calledWith(getUserPreferenceMock, fakeUserId, 'notifyCalendarEvents');
				sinon.assert.notCalled(api.broadcast as sinon.SinonStub);
			});
		});

		it('should send notification with correct event data', async () => {
			await testPrivateMethod(service, 'sendEventNotification', async (method) => {
				getUserPreferenceMock.resolves(true);

				const fakeEvent = {
					_id: fakeEventId,
					uid: fakeUserId,
					startTime: fakeStartTime,
					subject: fakeSubject,
				};

				await method(fakeEvent);

				sinon.assert.calledWith(
					api.broadcast as sinon.SinonStub,
					'notify.calendar',
					fakeUserId,
					sinon.match({
						title: fakeSubject,
						payload: { _id: fakeEventId },
					}),
				);
			});
		});
	});

	describe('Private: sendCurrentNotifications', () => {
		it('should send notification for all events and flag them as sent', async () => {
			await testPrivateMethod(service, 'sendCurrentNotifications', async (method) => {
				const proto = Object.getPrototypeOf(service);
				(proto.sendEventNotification as sinon.SinonStub).restore();
				sandbox.stub(proto, 'sendEventNotification').resolves();

				const fakeDate = new Date('2025-01-01T10:00:00Z');
				const fakeEvents = [
					{ _id: 'event1', uid: fakeUserId, startTime: fakeStartTime },
					{ _id: 'event2', uid: fakeUserId, startTime: fakeStartTime },
				];

				CalendarEventMock.findEventsToNotify.returns({
					toArray: sinon.stub().resolves(fakeEvents),
				});

				await method(fakeDate);

				sinon.assert.calledWith(CalendarEventMock.findEventsToNotify, fakeDate, 1);
				sinon.assert.calledTwice(proto.sendEventNotification as sinon.SinonStub);
				sinon.assert.calledTwice(CalendarEventMock.flagNotificationSent);
				sinon.assert.calledWith(CalendarEventMock.flagNotificationSent, 'event1');
				sinon.assert.calledWith(CalendarEventMock.flagNotificationSent, 'event2');
				sinon.assert.calledOnceWithExactly(proto.doSetupNextNotification as sinon.SinonStub, true);
			});
		});
	});

	describe('Private: doSetupNextNotification', () => {
		it('should remove calendar-reminders cron job if no events found', async () => {
			await testPrivateMethod(service, 'doSetupNextNotification', async (method) => {
				CalendarEventMock.findNextNotificationDate.resolves(null);
				cronJobsMock.jobNames.add('calendar-reminders');

				await method(false);

				expect(cronJobsMock.jobNames.has('calendar-reminders')).to.false;
			});
		});

		it('should schedule notifications at the next date', async () => {
			await testPrivateMethod(service, 'doSetupNextNotification', async (method) => {
				const nextDate = new Date('2025-01-01T10:00:00Z');
				CalendarEventMock.findNextNotificationDate.resolves(nextDate);

				await method(false);

				expect(cronJobsMock.jobNames.has('calendar-reminders')).to.true;
			});
		});

		it('should send current notifications if date is in the past', async () => {
			await testPrivateMethod(service, 'doSetupNextNotification', async (method) => {
				const proto = Object.getPrototypeOf(service);
				(proto.sendCurrentNotifications as sinon.SinonStub).restore();
				sandbox.stub(proto, 'sendCurrentNotifications').resolves();

				const pastDate = new Date();
				pastDate.setMinutes(pastDate.getMinutes() - 10);
				CalendarEventMock.findNextNotificationDate.resolves(pastDate);

				await method(false);

				sinon.assert.calledWith(proto.sendCurrentNotifications as sinon.SinonStub, pastDate);
				expect(cronJobsMock.jobNames.size).to.equal(0);
			});
		});

		it('should schedule future notifications even if date is in the past when recursive', async () => {
			await testPrivateMethod(service, 'doSetupNextNotification', async (method) => {
				const pastDate = new Date();
				pastDate.setMinutes(pastDate.getMinutes() - 10);
				CalendarEventMock.findNextNotificationDate.resolves(pastDate);

				await method(true);

				sinon.assert.notCalled(service.sendCurrentNotifications as sinon.SinonStub);
				expect(cronJobsMock.jobNames.size).to.equal(1);
			});
		});
	});

	describe('Overlapping events', () => {
		it('should not set up status change if no endTime is provided when updating', async () => {
			const fakeEvent = {
				_id: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				subject: fakeSubject,
			};

			CalendarEventMock.findOne.resolves(fakeEvent);

			await service.update(fakeEventId, {
				subject: 'New Subject',
			});

			sinon.assert.notCalled(statusEventManagerMock.setupAppointmentStatusChange);
		});

		it('should cancel upcoming status changes for a user', async () => {
			const customDate = new Date('2025-02-01');

			await service.cancelUpcomingStatusChanges(fakeUserId, customDate);

			sinon.assert.calledOnce(statusEventManagerMock.cancelUpcomingStatusChanges);
			sinon.assert.calledWith(statusEventManagerMock.cancelUpcomingStatusChanges, fakeUserId, customDate);
		});
	});
});
