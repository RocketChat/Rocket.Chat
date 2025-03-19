import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsMock = {
	get: sinon.stub().returns(true),
};

const cronJobsMock = {
	has: sinon.stub().resolves(false),
	remove: sinon.stub().resolves(),
	addAtTimestamp: sinon.stub().resolves(),
};

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

	beforeEach(() => {
		setupCronJobsMocks();
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

	function setupSettingsMocks() {
		applyStatusChange.resetHistory();
		handleOverlappingEvents.resetHistory();

		Object.assign(settingsMock, {
			get: sinon.stub().returns(true),
		});
	}

	describe('#setupAppointmentStatusChange', () => {
		it('should do nothing if busy status setting is disabled', async () => {
			settingsMock.get.returns(false);

			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, undefined, false);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
		});

		it('should do nothing if endTime is not provided', async () => {
			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, undefined, undefined, false);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
		});

		it('should handle overlapping events when shouldScheduleRemoval=true', async () => {
			handleOverlappingEvents.resolves({ shouldProceed: false });

			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, true);

			expect(handleOverlappingEvents.callCount).to.equal(1);
			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(0);
		});

		it('should schedule status change at the start time when shouldScheduleRemoval=true', async () => {
			handleOverlappingEvents.resolves({ shouldProceed: true });

			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, true);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(1);
			expect(cronJobsMock.addAtTimestamp.firstCall.args[1]).to.equal(fakeStartTime);
		});

		it('should schedule status change at the end time when shouldScheduleRemoval=false', async () => {
			await setupAppointmentStatusChange(fakeEventId, fakeUserId, fakeStartTime, fakeEndTime, UserStatus.BUSY, false);

			expect(cronJobsMock.addAtTimestamp.callCount).to.equal(1);
			expect(cronJobsMock.addAtTimestamp.firstCall.args[1]).to.equal(fakeEndTime);
		});
	});
});
