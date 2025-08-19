import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { MockedCronJobs } from '../mocks/cronJobs';

const settingsMock = new Map<string, any>();

const fakeUserId = 'userId456';
const CalendarEventMock = {
	findEligibleEventsForCancelation: sinon.stub().returns({
		toArray: sinon.stub().resolves([
			{ _id: 'event1', uid: fakeUserId },
			{ _id: 'event2', uid: fakeUserId },
		]),
	}),
};

const cronJobsMock = new MockedCronJobs();

const { cancelUpcomingStatusChanges } = proxyquire
	.noCallThru()
	.load('../../../../../../server/services/calendar/statusEvents/cancelUpcomingStatusChanges', {
		'../../../../app/settings/server': { settings: settingsMock },
		'@rocket.chat/cron': { cronJobs: cronJobsMock },
		'@rocket.chat/models': {
			CalendarEvent: CalendarEventMock,
		},
	});

describe('Calendar.StatusEvents', () => {
	describe('#cancelUpcomingStatusChanges', () => {
		it('should do nothing if busy status setting is disabled', async () => {
			settingsMock.set('Calendar_BusyStatus_Enabled', false);

			const events = [
				{ _id: 'event1', uid: fakeUserId },
				{ _id: 'event2', uid: fakeUserId },
			];

			cronJobsMock.jobNames.clear();
			cronJobsMock.jobNames.add(`calendar-presence-status-event1-${fakeUserId}`);
			cronJobsMock.jobNames.add(`calendar-presence-status-event2-${fakeUserId}`);
			cronJobsMock.jobNames.add(`calendar-presence-status-event3-${fakeUserId}`);

			CalendarEventMock.findEligibleEventsForCancelation.returns({
				toArray: sinon.stub().resolves(events),
			});

			await cancelUpcomingStatusChanges(fakeUserId);

			expect(cronJobsMock.jobNames.has(`calendar-presence-status-event1-${fakeUserId}`)).to.true;
			expect(cronJobsMock.jobNames.has(`calendar-presence-status-event2-${fakeUserId}`)).to.true;
			expect(cronJobsMock.jobNames.has(`calendar-presence-status-event3-${fakeUserId}`)).to.true;
		});

		it('should find and cancel active events', async () => {
			settingsMock.set('Calendar_BusyStatus_Enabled', true);

			const events = [
				{ _id: 'event1', uid: fakeUserId },
				{ _id: 'event2', uid: fakeUserId },
			];

			cronJobsMock.jobNames.clear();
			cronJobsMock.jobNames.add(`calendar-presence-status-event1-${fakeUserId}`);
			cronJobsMock.jobNames.add(`calendar-presence-status-event2-${fakeUserId}`);
			cronJobsMock.jobNames.add(`calendar-presence-status-event3-${fakeUserId}`);

			CalendarEventMock.findEligibleEventsForCancelation.returns({
				toArray: sinon.stub().resolves(events),
			});

			await cancelUpcomingStatusChanges(fakeUserId);

			expect(cronJobsMock.jobNames.has(`calendar-presence-status-event1-${fakeUserId}`)).to.false;
			expect(cronJobsMock.jobNames.has(`calendar-presence-status-event2-${fakeUserId}`)).to.false;
			expect(cronJobsMock.jobNames.has(`calendar-presence-status-event3-${fakeUserId}`)).to.true;
		});
	});
});
