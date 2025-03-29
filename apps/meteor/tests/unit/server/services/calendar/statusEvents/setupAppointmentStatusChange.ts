import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { MockedCronJobs } from '../mocks/cronJobs';

const settingsMock = new Map<string, any>();
const cronJobsMock = new MockedCronJobs();

const applyStatusChange = sinon.stub();
const handleOverlappingEvents = sinon.stub();

const { setupAppointmentStatusChange } = proxyquire
	.noCallThru()
	.load('../../../../../../server/services/calendar/statusEvents/setupAppointmentStatusChange', {
		'./applyStatusChange': { applyStatusChange },
		'./handleOverlappingEvents': { handleOverlappingEvents },
		'../../../../app/settings/server': { settings: settingsMock },
		'@rocket.chat/cron': { cronJobs: cronJobsMock },
	});

describe('Calendar.StatusEvents', () => {
	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';
	const fakeStartTime = new Date('2025-01-01T10:00:00Z');
	const fakeEndTime = new Date('2025-01-01T11:00:00Z');
	const statusId = `calendar-presence-status-${fakeEventId}-${fakeUserId}`;

	beforeEach(() => {
		cronJobsMock.jobNames.clear();
		applyStatusChange.resetHistory();
		handleOverlappingEvents.resetHistory();
		settingsMock.clear();
		settingsMock.set('Calendar_BusyStatus_Enabled', true);
	});

	describe('#setupAppointmentStatusChange', () => {
		it('should do nothing if busy status setting is disabled', async () => {
			settingsMock.set('Calendar_BusyStatus_Enabled', false);

			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, undefined, false);

			expect(cronJobsMock.jobNames.size).to.equal(0);
		});

		it('should do nothing if endTime is not provided', async () => {
			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, undefined, undefined, false);

			expect(cronJobsMock.jobNames.size).to.equal(0);
		});

		it('should handle overlapping events when shouldScheduleRemoval=true', async () => {
			handleOverlappingEvents.resolves({ shouldProceed: false });

			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, true);

			expect(handleOverlappingEvents.callCount).to.equal(1);
			expect(cronJobsMock.jobNames.size).to.equal(0);
		});

		it('should schedule status change at the start time when shouldScheduleRemoval=true', async () => {
			handleOverlappingEvents.resolves({ shouldProceed: true });

			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, true);

			expect(cronJobsMock.jobNames.has(statusId)).to.true;
		});

		it('should schedule status change at the end time when shouldScheduleRemoval=false', async () => {
			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, false);

			expect(cronJobsMock.jobNames.has(statusId)).to.true;
		});
	});
});
