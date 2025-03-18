import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const cronJobsMock = {
	has: sinon.stub().resolves(false),
	remove: sinon.stub().resolves(),
	addAtTimestamp: sinon.stub().resolves(),
};

const { removeCronJobs } = proxyquire.noCallThru().load('../../../../../server/services/calendar/statusEvents/removeCronJobs', {
	'@rocket.chat/cron': { cronJobs: cronJobsMock },
});

describe('StatusEventManager', () => {
	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';

	beforeEach(() => {
		setupCronJobsMocks();
	});

	function setupCronJobsMocks() {
		const freshMocks = {
			has: sinon.stub().resolves(false),
			remove: sinon.stub().resolves(),
			addAtTimestamp: sinon.stub().resolves(),
		};

		Object.assign(cronJobsMock, freshMocks);
	}

	describe('#removeCronJobs', () => {
		it('should check and remove status and reminder jobs', async () => {
			cronJobsMock.has.resolves(true);

			await removeCronJobs(fakeEventId, fakeUserId);

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

			await removeCronJobs(fakeEventId, fakeUserId);

			expect(cronJobsMock.has.callCount).to.equal(2);
			expect(cronJobsMock.remove.callCount).to.equal(0);
		});
	});
});
