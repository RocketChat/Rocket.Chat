import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsMock = {
	get: sinon.stub().returns(true),
};

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
	const fakeUserId = 'userId456';

	beforeEach(() => {
		setupCronJobsMocks();
		setupCalendarEventMocks();
		setupSettingsMocks();
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

	function setupSettingsMocks() {
		Object.assign(settingsMock, {
			get: sinon.stub().returns(true),
		});
	}

	describe('#cancelUpcomingStatusChanges', () => {
		it('should do nothing if busy status setting is disabled', async () => {
			settingsMock.get.returns(false);

			await cancelUpcomingStatusChanges(fakeUserId);

			expect(CalendarEventMock.findEligibleEventsForCancelation.callCount).to.equal(0);
		});

		it('should find and cancel active events', async () => {
			const events = [
				{ _id: 'event1', uid: fakeUserId },
				{ _id: 'event2', uid: fakeUserId },
			];

			cronJobsMock.has.resetHistory();
			cronJobsMock.remove.resetHistory();
			cronJobsMock.has.resolves(true);

			CalendarEventMock.findEligibleEventsForCancelation.returns({
				toArray: sinon.stub().resolves(events),
			});

			await cancelUpcomingStatusChanges(fakeUserId);

			expect(cronJobsMock.has.callCount).to.equal(2);
			expect(cronJobsMock.remove.callCount).to.equal(2);
		});
	});
});
