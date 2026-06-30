import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

// The mock helper (`MockedCronJobs`) is an ESM module and cannot be `require()`d inside `vi.hoisted`,
// so we build the cron-jobs mock lazily inside an async `vi.mock` factory and expose the instance
// through a hoisted holder that the test body can read.
const holder = vi.hoisted(() => ({ cronJobsMock: undefined as any }));

vi.mock('@rocket.chat/cron', async () => {
	const { MockedCronJobs } = await import('../mocks/cronJobs');
	holder.cronJobsMock = new MockedCronJobs();
	return { cronJobs: holder.cronJobsMock };
});

const { removeCronJobs } = await import('../../../../../../server/services/calendar/statusEvents/removeCronJobs');
const cronJobsMock = holder.cronJobsMock;

describe('Calendar.StatusEvents', () => {
	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';
	const fakeUserId2 = 'userId4562';

	const statusId = `calendar-presence-status-${fakeEventId}-${fakeUserId}`;
	const reminderId = `calendar-reminder-${fakeEventId}-${fakeUserId}`;
	const statusId2 = `calendar-presence-status-${fakeEventId}-${fakeUserId2}`;
	const reminderId2 = `calendar-reminder-${fakeEventId}-${fakeUserId2}`;

	beforeEach(() => {
		cronJobsMock.jobNames.clear();
	});

	describe('#removeCronJobs', () => {
		it('should check and remove status and reminder jobs', async () => {
			cronJobsMock.jobNames.clear();
			cronJobsMock.jobNames.add(statusId);
			cronJobsMock.jobNames.add(reminderId);

			await removeCronJobs(fakeEventId, fakeUserId);

			expect(cronJobsMock.jobNames.has(statusId)).to.equal(false);
			expect(cronJobsMock.jobNames.has(reminderId)).to.equal(false);
		});

		it('should not remove jobs from other users', async () => {
			cronJobsMock.jobNames.clear();
			cronJobsMock.jobNames.add(statusId);
			cronJobsMock.jobNames.add(reminderId);
			cronJobsMock.jobNames.add(statusId2);
			cronJobsMock.jobNames.add(reminderId2);

			await removeCronJobs(fakeEventId, fakeUserId);

			expect(cronJobsMock.jobNames.has(statusId)).to.equal(false);
			expect(cronJobsMock.jobNames.has(reminderId)).to.equal(false);
			expect(cronJobsMock.jobNames.has(statusId2)).to.equal(true);
			expect(cronJobsMock.jobNames.has(reminderId2)).to.equal(true);
		});
	});
});
