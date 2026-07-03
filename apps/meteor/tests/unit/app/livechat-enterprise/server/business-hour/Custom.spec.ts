import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const cursor = (docs: unknown[]) => ({ toArray: async () => docs });

const LivechatBusinessHoursStub = {
	findOne: sinon.stub().resolves(null),
	updateOne: sinon.stub().resolves({}),
	insertOne: sinon.stub().resolves({ insertedId: 'new-bh-id' }),
	findOneDefaultBusinessHour: sinon.stub().resolves({ _id: 'default-bh', active: false, type: 'default', workHours: [] }),
};

const LivechatDepartmentStub = {
	findByBusinessHourId: sinon.stub().returns(cursor([])),
	findInIds: sinon.stub().returns(cursor([])),
	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId: sinon.stub().resolves(undefined),
	addBusinessHourToDepartmentsByIds: sinon.stub().resolves(undefined),
};

const LivechatDepartmentAgentsStub = {
	findByDepartmentIds: sinon.stub().returns(cursor([])),
};

const UsersStub = {
	findAgentsAvailableWithoutBusinessHours: sinon.stub().returns(cursor([])),
	updateLivechatStatusByAgentIds: sinon.stub().resolves({ modifiedCount: 0 }),
	closeAgentsBusinessHoursByBusinessHourIds: sinon.stub().resolves(undefined),
	removeBusinessHourByAgentIds: sinon.stub().resolves(undefined),
};

const registerBusinessHourTypeStub = sinon.stub();

// Only the DB layer and the meteor-heavy imports are stubbed; Custom.ts,
// AbstractBusinessHour (real convertWorkHours/baseSaveBusinessHour) and
// Helper run for real.
proxyquire.noCallThru().load('../../../../../../ee/app/livechat-enterprise/server/business-hour/Custom', {
	'../../../../../app/livechat/server/business-hour': {
		businessHourManager: { registerBusinessHourType: registerBusinessHourTypeStub },
	},
	'@rocket.chat/models': {
		'@global': true,
		'LivechatBusinessHours': LivechatBusinessHoursStub,
		'LivechatDepartment': LivechatDepartmentStub,
		'LivechatDepartmentAgents': LivechatDepartmentAgentsStub,
		'Users': UsersStub,
	},
	'../../../lib/server/lib/notifyListener': {
		'@global': true,
		'notifyOnUserChange': sinon.stub(),
		'notifyOnUserChangeAsync': sinon.stub(),
	},
});

const customBusinessHour = registerBusinessHourTypeStub.firstCall.args[0];

const baseBusinessHour = {
	_id: 'bh-id',
	name: 'test-bh',
	active: true,
	type: 'custom',
	timezoneName: 'America/Noronha',
	workHours: [{ day: 'Monday', start: '07:00', finish: '18:00', open: true }],
};

describe('[OC] CustomBusinessHour', () => {
	describe('saveBusinessHour()', () => {
		beforeEach(() => {
			LivechatBusinessHoursStub.updateOne.resetHistory();
			LivechatDepartmentStub.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId.resetHistory();
			LivechatDepartmentStub.addBusinessHourToDepartmentsByIds.resetHistory();
			LivechatDepartmentStub.findByBusinessHourId.reset();
			LivechatDepartmentStub.findByBusinessHourId.returns(cursor([{ _id: 'dept1' }, { _id: 'dept2' }]));
		});

		it('should not touch department links when departmentsToApplyBusinessHour is not provided (internal re-save, e.g. DST verifier)', async () => {
			await customBusinessHour.saveBusinessHour({ ...baseBusinessHour, workHours: structuredClone(baseBusinessHour.workHours) });

			expect(LivechatDepartmentStub.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId.called).to.be.false;
			expect(LivechatDepartmentStub.addBusinessHourToDepartmentsByIds.called).to.be.false;
			expect(LivechatBusinessHoursStub.updateOne.calledOnce).to.be.true;
		});

		it('should still recompute the UTC work hours from the business hour timezone on an internal re-save', async () => {
			await customBusinessHour.saveBusinessHour({ ...baseBusinessHour, workHours: structuredClone(baseBusinessHour.workHours) });

			const { $set } = LivechatBusinessHoursStub.updateOne.firstCall.args[1];
			// 07:00 in America/Noronha (UTC-2, no DST) is 09:00 UTC
			expect($set.workHours[0].start.utc).to.deep.include({ dayOfWeek: 'Monday', time: '09:00' });
			expect($set.workHours[0].finish.utc).to.deep.include({ dayOfWeek: 'Monday', time: '20:00' });
			expect($set.timezone).to.deep.equal({ name: 'America/Noronha', utc: '-02:00' });
		});

		it('should unlink all departments when departmentsToApplyBusinessHour is an empty string', async () => {
			await customBusinessHour.saveBusinessHour({
				...baseBusinessHour,
				workHours: structuredClone(baseBusinessHour.workHours),
				departmentsToApplyBusinessHour: '',
			});

			expect(LivechatDepartmentStub.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId.calledOnceWith(['dept1', 'dept2'], 'bh-id')).to
				.be.true;
			expect(LivechatDepartmentStub.addBusinessHourToDepartmentsByIds.called).to.be.false;
		});

		it('should reconcile department links when departmentsToApplyBusinessHour is provided', async () => {
			await customBusinessHour.saveBusinessHour({
				...baseBusinessHour,
				workHours: structuredClone(baseBusinessHour.workHours),
				departmentsToApplyBusinessHour: 'dept1,dept3',
			});

			expect(LivechatDepartmentStub.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId.calledOnceWith(['dept2'], 'bh-id')).to.be.true;
			expect(LivechatDepartmentStub.addBusinessHourToDepartmentsByIds.calledOnceWith(['dept3'], 'bh-id')).to.be.true;
		});
	});
});
