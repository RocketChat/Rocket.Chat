import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const CalendarEventMock = {
	find: sinon.stub(),
	findOne: sinon.stub(),
	findOverlappingEvents: sinon.stub(),
	findEligibleEventsForCancelation: sinon.stub(),
};

const cronJobsMock = {
	has: sinon.stub().resolves(false),
	remove: sinon.stub().resolves(),
	addAtTimestamp: sinon.stub().resolves(),
};

const applyStatusChange = sinon.stub();

const { handleOverlappingEvents } = proxyquire
	.noCallThru()
	.load('../../../../../../server/services/calendar/statusEvents/handleOverlappingEvents', {
		'./applyStatusChange': { applyStatusChange },
		'@rocket.chat/cron': { cronJobs: cronJobsMock },
		'@rocket.chat/models': {
			CalendarEvent: CalendarEventMock,
		},
	});

describe('Calendar.StatusEvents', () => {
	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';
	const fakeStartTime = new Date('2025-01-01T10:00:00Z');
	const fakeEndTime = new Date('2025-01-01T11:00:00Z');

	beforeEach(() => {
		setupCronJobsMocks();
		setupCalendarEventMocks();
		applyStatusChange.resetHistory();
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
			findOverlappingEvents: sinon.stub().returns({
				toArray: sinon.stub().resolves([]),
			}),
			findEligibleEventsForCancelation: sinon.stub().returns({
				toArray: sinon.stub().resolves([]),
			}),
		};

		Object.assign(CalendarEventMock, freshMocks);
	}

	describe('#handleOverlappingEvents', () => {
		it('should return shouldProceed=true when no overlapping events', async () => {
			// Clear previous calls
			CalendarEventMock.findOverlappingEvents.reset();
			cronJobsMock.addAtTimestamp.reset();

			// Set up the mock to return no overlapping events
			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
			sinon.assert.calledWith(CalendarEventMock.findOverlappingEvents, fakeEventId, fakeUserId, fakeStartTime, fakeEndTime);
		});

		it('should handle case when current event is not the latest ending', async () => {
			const laterEvent = {
				_id: 'laterEvent',
				startTime: fakeStartTime,
				endTime: new Date('2025-01-01T12:00:00Z'), // Later than fakeEndTime
			};

			// Clear previous calls
			cronJobsMock.has.resetHistory();
			cronJobsMock.addAtTimestamp.resetHistory();

			// Mock a specific response for this test
			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([laterEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

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

			// Clear previous calls
			cronJobsMock.has.resetHistory();
			cronJobsMock.remove.resetHistory();

			// Set up has to return true for the specific job ID
			cronJobsMock.has.withArgs(`calendar-presence-status-${earlierEvent._id}-${fakeUserId}`).resolves(true);

			// Mock a specific response for this test
			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([earlierEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.remove.callCount).to.equal(1);
			expect(cronJobsMock.remove.firstCall.args[0]).to.include('earlierEvent');
		});

		it('should handle multiple overlapping events with different end times', async () => {
			const earlierEvent = {
				_id: 'earlierEvent',
				startTime: new Date('2025-01-01T09:00:00Z'),
				endTime: new Date('2025-01-01T10:30:00Z'), // Earlier than fakeEndTime
			};

			const laterEvent = {
				_id: 'laterEvent',
				startTime: new Date('2025-01-01T10:30:00Z'),
				endTime: new Date('2025-01-01T12:00:00Z'), // Later than fakeEndTime
			};

			cronJobsMock.has.reset();
			cronJobsMock.remove.reset();
			cronJobsMock.addAtTimestamp.reset();

			const currentEventJobId = `calendar-presence-status-${fakeEventId}-${fakeUserId}`;
			cronJobsMock.has.withArgs(currentEventJobId).resolves(false);

			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([earlierEvent, laterEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: false });

			expect(cronJobsMock.has.called).to.be.true;

			expect(cronJobsMock.addAtTimestamp.called).to.be.true;
			expect(cronJobsMock.addAtTimestamp.getCall(0).args[0]).to.equal(currentEventJobId);
			expect(cronJobsMock.addAtTimestamp.getCall(0).args[1]).to.equal(fakeStartTime);
		});

		it('should handle an event completely contained within the current event', async () => {
			const containedEvent = {
				_id: 'containedEvent',
				startTime: new Date('2025-01-01T10:15:00Z'), // After fakeStartTime
				endTime: new Date('2025-01-01T10:45:00Z'), // Before fakeEndTime
			};

			cronJobsMock.has.resetHistory();
			cronJobsMock.remove.resetHistory();

			cronJobsMock.has.withArgs(`calendar-presence-status-${containedEvent._id}-${fakeUserId}`).resolves(true);

			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([containedEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.remove.callCount).to.equal(1);
			expect(cronJobsMock.remove.firstCall.args[0]).to.include('containedEvent');
		});

		it('should handle an event that completely contains the current event', async () => {
			const containingEvent = {
				_id: 'containingEvent',
				startTime: new Date('2025-01-01T09:00:00Z'), // Before fakeStartTime
				endTime: new Date('2025-01-01T12:00:00Z'), // After fakeEndTime
			};

			cronJobsMock.has.resetHistory();
			cronJobsMock.addAtTimestamp.resetHistory();

			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([containingEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: false });
			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(1);
		});
	});
});
