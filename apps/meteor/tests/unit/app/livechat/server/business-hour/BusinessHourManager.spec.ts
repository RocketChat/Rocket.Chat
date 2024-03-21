/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const formatStub = sinon.stub().returns('00:00');
const isSameStub = sinon.stub().returns(true);
const isDSTStub = sinon.stub().returns(true);

const momentStub = sinon.stub().returns({
	utc: () => ({
		tz: () => ({
			format: formatStub,
			isSame: isSameStub,
			isDST: isDSTStub,
		}),
	}),
});

const findActiveBusinessHoursStub = sinon.stub().returns([]);
const LivechatBusinessHoursStub = {
	findActiveBusinessHours: findActiveBusinessHoursStub,
};
const saveBusinessHourStub = sinon.stub();

const { BusinessHourManager } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/business-hour/BusinessHourManager', {
	'../../../settings/server': {},
	'../../../../lib/callbacks': {},
	'../../../../ee/app/livechat-enterprise/server/business-hour/Helper': {},
	'./AbstractBusinessHour': {},
	'moment': momentStub,
	'@rocket.chat/models': {
		LivechatBusinessHours: LivechatBusinessHoursStub,
	},
});

const cronAddStub = sinon.stub();
const cronRemoveStub = sinon.stub();

describe('[OC] BusinessHourManager', () => {
	afterEach(() => sinon.restore());
	describe('hasDaylightSavingTimeChanged()', () => {
		const manager = new BusinessHourManager({} as any);

		it('should return false if the provided timezone is equal to the current one (No changes in the timezone)', () => {
			formatStub.returns('00:00');
			expect(manager.hasDaylightSavingTimeChanged({ name: 'test', utc: '00:00' })).to.be.false;
		});

		it('should return false if the provided timezone is different to the current one, the current time is in DST but there is no difference between times (current, stored)', () => {
			isDSTStub.returns(true);
			formatStub.returns('01:00');
			isSameStub.returns(true);
			expect(manager.hasDaylightSavingTimeChanged({ name: 'test', utc: '00:00' })).to.be.false;
		});

		it('should return false if the provided timezone is different to the current one, the current time is NOT in DST but there is no difference between times (current, stored)', () => {
			isDSTStub.returns(false);
			formatStub.returns('01:00');
			isSameStub.returns(true);
			expect(manager.hasDaylightSavingTimeChanged({ name: 'test', utc: '00:00' })).to.be.false;
		});

		it('should return true if the provided timezone is different to the current one, the current time is in DST and the current time is different than the stored one', () => {
			isDSTStub.returns(true);
			formatStub.returns('01:00');
			isSameStub.returns(false);
			expect(manager.hasDaylightSavingTimeChanged({ name: 'test', utc: '00:00' })).to.be.true;
		});

		it('should return true if the provided timezone is different to the current one, the current time is NOT in DST and the current time is different than the stored one', () => {
			isDSTStub.returns(false);
			formatStub.returns('01:00');
			isSameStub.returns(false);
			expect(manager.hasDaylightSavingTimeChanged({ name: 'test', utc: '00:00' })).to.be.true;
		});
	});

	describe('startDaylightSavingTimeVerifier()', () => {
		const cronStub = {
			add: cronAddStub,
			remove: cronRemoveStub,
		};
		const manager = new BusinessHourManager(cronStub);
		manager.registerBusinessHourBehavior({
			onStartBusinessHours: () => {},
			onDisableBusinessHours: () => {},
		});

		it('should call the verifier when the manager starts', async () => {
			sinon.stub(manager, 'createCronJobsForWorkHours');
			sinon.stub(manager, 'setupCallbacks');
			sinon.stub(manager, 'cleanupDisabledDepartmentReferences');
			sinon.stub(manager, 'startDaylightSavingTimeVerifier');
			await manager.startManager();
			expect(manager.startDaylightSavingTimeVerifier.called).to.be.true;
		});

		it('should register the cron job for the DST verifier when the manager starts', async () => {
			sinon.stub(manager, 'createCronJobsForWorkHours');
			sinon.stub(manager, 'setupCallbacks');
			sinon.stub(manager, 'cleanupDisabledDepartmentReferences');
			sinon.stub(manager, 'startDaylightSavingTimeVerifier');
			await manager.startManager();
			expect(cronAddStub.called).to.be.true;
		});

		it('should remove the cron job for the DST verifier when the manager stops', async () => {
			sinon.stub(manager, 'removeCronJobs');
			sinon.stub(manager, 'clearCronJobsCache');
			sinon.stub(manager, 'removeCallbacks');
			sinon.stub(manager, 'startDaylightSavingTimeVerifier');
			await manager.stopManager();
			expect(cronRemoveStub.called).to.be.true;
		});

		it('should remove and add back the cron job for the DST verifier when the manager restarts', async () => {
			sinon.stub(manager, 'createCronJobsForWorkHours');
			sinon.stub(manager, 'setupCallbacks');
			sinon.stub(manager, 'cleanupDisabledDepartmentReferences');
			sinon.stub(manager, 'startDaylightSavingTimeVerifier');
			sinon.stub(manager, 'removeCronJobs');
			sinon.stub(manager, 'clearCronJobsCache');
			sinon.stub(manager, 'removeCallbacks');
			await manager.restartManager();
			expect(cronRemoveStub.called).to.be.true;
			expect(cronAddStub.called).to.be.true;
		});

		it('should NOT save business hours when there is no active business hours', async () => {
			sinon.stub(manager, 'getBusinessHourType').returns({ saveBusinessHour: saveBusinessHourStub });
			findActiveBusinessHoursStub.resolves([]);
			await manager.startDaylightSavingTimeVerifier();
			expect(saveBusinessHourStub.called).to.be.false;
		});

		it('should NOT save business hours when there is no timezone with DST changes', async () => {
			sinon.stub(manager, 'getBusinessHourType').returns({ saveBusinessHour: saveBusinessHourStub });
			sinon.stub(manager, 'hasDaylightSavingTimeChanged').returns(false);
			findActiveBusinessHoursStub.resolves([{ timezone: 'test' }]);
			await manager.startDaylightSavingTimeVerifier();
			expect(saveBusinessHourStub.called).to.be.false;
		});

		it('should save business hours AND recreate the cron jobs for the work hours when there is a timezone with DST changes', async () => {
			sinon.stub(manager, 'getBusinessHourType').returns({ saveBusinessHour: saveBusinessHourStub });
			sinon.stub(manager, 'createCronJobsForWorkHours');
			sinon.stub(manager, 'hasDaylightSavingTimeChanged').returns(true);
			findActiveBusinessHoursStub.resolves([
				{ timezone: { name: 'timezoneName' }, workHours: [{ start: { time: 'startTime' }, finish: { time: 'finishTime' } }] },
			]);
			await manager.startDaylightSavingTimeVerifier();
			expect(
				saveBusinessHourStub.calledWith({
					timezone: { name: 'timezoneName' },
					timezoneName: 'timezoneName',
					workHours: [{ start: 'startTime', finish: 'finishTime' }],
				}),
			).to.be.true;
			expect(manager.createCronJobsForWorkHours.called).to.be.true;
		});
	});
});
