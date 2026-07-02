import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, vi } from 'vitest';

import { MockedCronJobs } from '../mocks/cronJobs';

const fakeUserId = 'userId456';

const { settingsMock, cronHolder, CalendarEventMock } = vi.hoisted(() => {
	const sinon = require('sinon');
	const fakeUserId = 'userId456';
	return {
		settingsMock: new Map<string, any>(),
		// cronJobsMock built after top-level import (see service.tests.ts for rationale).
		cronHolder: { cronJobsMock: undefined as any },
		CalendarEventMock: {
			findEligibleEventsForCancelation: sinon.stub().returns({
				toArray: sinon.stub().resolves([
					{ _id: 'event1', uid: fakeUserId },
					{ _id: 'event2', uid: fakeUserId },
				]),
			}),
		},
	};
});

vi.mock('../../../../../../app/settings/server', () => ({ settings: settingsMock }));
vi.mock('@rocket.chat/cron', () => ({ cronJobs: cronHolder.cronJobsMock }));
vi.mock('@rocket.chat/models', () => ({
	CalendarEvent: CalendarEventMock,
}));

cronHolder.cronJobsMock = new MockedCronJobs();
const { cronJobsMock } = cronHolder;

const { cancelUpcomingStatusChanges } = await import('../../../../../../server/services/calendar/statusEvents/cancelUpcomingStatusChanges');

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
