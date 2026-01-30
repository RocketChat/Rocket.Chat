import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { MockedCronJobs } from '../mocks/cronJobs';

const CalendarEventMock = {
	findOverlappingEvents: sinon.stub(),
};

const cronJobsMock = new MockedCronJobs();

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
	const statusId = `calendar-presence-status-${fakeEventId}-${fakeUserId}`;
	const containedStatusId = `calendar-presence-status-containedEvent-${fakeUserId}`;

	beforeEach(() => {
		cronJobsMock.jobNames.clear();
		setupCalendarEventMocks();
		applyStatusChange.resetHistory();
	});

	function setupCalendarEventMocks() {
		CalendarEventMock.findOverlappingEvents.reset();
		CalendarEventMock.findOverlappingEvents.returns({
			toArray: sinon.stub().resolves([]),
		});
	}

	describe('#handleOverlappingEvents', () => {
		it('should return shouldProceed=true when no overlapping events', async () => {
			// Clear previous calls
			CalendarEventMock.findOverlappingEvents.reset();

			// Set up the mock to return no overlapping events
			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.jobNames.size).to.equal(0);
			sinon.assert.calledWith(CalendarEventMock.findOverlappingEvents, fakeEventId, fakeUserId, fakeStartTime, fakeEndTime);
		});

		it('should handle case when current event is not the latest ending', async () => {
			const laterEvent = {
				_id: 'laterEvent',
				startTime: fakeStartTime,
				endTime: new Date('2025-01-01T12:00:00Z'), // Later than fakeEndTime
			};

			// Mock a specific response for this test
			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([laterEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: false });
			expect(cronJobsMock.jobNames.has(statusId)).to.equal(true);
		});

		it('should remove status jobs for events ending before the current one', async () => {
			const earlierEvent = {
				_id: 'earlierEvent',
				startTime: new Date('2025-01-01T09:00:00Z'),
				endTime: new Date('2025-01-01T10:30:00Z'), // Earlier than fakeEndTime
			};

			// Set up has to return true for the specific job ID
			cronJobsMock.jobNames.add(statusId);

			// Mock a specific response for this test
			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([earlierEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.jobNames.has(statusId)).to.equal(false);
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

			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([earlierEvent, laterEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: false });
			expect(cronJobsMock.jobNames.has(statusId)).to.be.true;
		});

		it('should handle an event completely contained within the current event', async () => {
			const containedEvent = {
				_id: 'containedEvent',
				startTime: new Date('2025-01-01T10:15:00Z'), // After fakeStartTime
				endTime: new Date('2025-01-01T10:45:00Z'), // Before fakeEndTime
			};

			cronJobsMock.jobNames.add(statusId);

			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([containedEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: true });
			expect(cronJobsMock.jobNames.has(statusId)).to.be.false;
			expect(cronJobsMock.jobNames.has(containedStatusId)).to.be.true;
		});

		it('should handle an event that completely contains the current event', async () => {
			const containingEvent = {
				_id: 'containingEvent',
				startTime: new Date('2025-01-01T09:00:00Z'), // Before fakeStartTime
				endTime: new Date('2025-01-01T12:00:00Z'), // After fakeEndTime
			};

			CalendarEventMock.findOverlappingEvents.returns({
				toArray: sinon.stub().resolves([containingEvent]),
			});

			const result = await handleOverlappingEvents(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY);

			expect(result).to.deep.equal({ shouldProceed: false });
			expect(cronJobsMock.jobNames.has(statusId)).to.be.true;
		});
	});
});
