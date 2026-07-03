import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const registerBusinessHourTypeStub = sinon.stub();

const businessHourRepoStub = {
	findOne: sinon.stub().resolves(null),
	findOneById: sinon.stub().resolves(null),
	findOneDefaultBusinessHour: sinon.stub().resolves(null),
};

const baseSaveStub = sinon.stub().resolves('bh-id');

class AbstractBusinessHourTypeStub {
	protected BusinessHourRepository = businessHourRepoStub;

	protected UsersRepository = {};

	protected baseSaveBusinessHour(businessHourData: unknown): Promise<string> {
		return baseSaveStub(businessHourData);
	}

	protected getUTCFromTimezone(): string {
		return '+00:00';
	}
}

const linkedDepartmentsStub = sinon.stub().resolves([]);
const removeBusinessHourFromDepartmentsStub = sinon.stub().resolves(undefined);
const addBusinessHourToDepartmentsStub = sinon.stub().resolves(undefined);
const findInIdsToArrayStub = sinon.stub().resolves([]);

const LivechatDepartmentStub = {
	findByBusinessHourId: sinon.stub().returns({ toArray: linkedDepartmentsStub }),
	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId: removeBusinessHourFromDepartmentsStub,
	addBusinessHourToDepartmentsByIds: addBusinessHourToDepartmentsStub,
	findInIds: sinon.stub().returns({ toArray: findInIdsToArrayStub }),
};

const UsersStub = {
	closeAgentsBusinessHoursByBusinessHourIds: sinon.stub().resolves(undefined),
	removeBusinessHourByAgentIds: sinon.stub().resolves(undefined),
};

proxyquire.noCallThru().load('../../../../../../ee/app/livechat-enterprise/server/business-hour/Custom', {
	'@rocket.chat/models': {
		LivechatDepartment: LivechatDepartmentStub,
		LivechatDepartmentAgents: {},
		Users: UsersStub,
	},
	'../../../../../app/livechat/server/business-hour': {
		businessHourManager: { registerBusinessHourType: registerBusinessHourTypeStub },
	},
	'../../../../../app/livechat/server/business-hour/AbstractBusinessHour': {
		AbstractBusinessHourType: AbstractBusinessHourTypeStub,
	},
	'../../../../../app/livechat/server/business-hour/Helper': {
		filterBusinessHoursThatMustBeOpened: sinon.stub().resolves([]),
		makeAgentsUnavailableBasedOnBusinessHour: sinon.stub().resolves(undefined),
	},
	'../lib/logger': {
		bhLogger: { error: sinon.stub(), debug: sinon.stub() },
	},
});

const customBusinessHour = registerBusinessHourTypeStub.firstCall.args[0];

const baseBusinessHour = {
	name: 'test-bh',
	active: true,
	type: 'custom',
	timezoneName: 'America/New_York',
	workHours: [],
};

describe('[OC] CustomBusinessHour', () => {
	describe('saveBusinessHour()', () => {
		beforeEach(() => {
			baseSaveStub.resetHistory();
			removeBusinessHourFromDepartmentsStub.resetHistory();
			addBusinessHourToDepartmentsStub.resetHistory();
			LivechatDepartmentStub.findByBusinessHourId.resetHistory();
		});

		it('should not touch department links when departmentsToApplyBusinessHour is not provided (internal re-save, e.g. DST verifier)', async () => {
			linkedDepartmentsStub.resolves([{ _id: 'dept1' }, { _id: 'dept2' }]);

			await customBusinessHour.saveBusinessHour({ ...baseBusinessHour, _id: 'bh-id' });

			expect(baseSaveStub.calledOnce).to.be.true;
			expect(removeBusinessHourFromDepartmentsStub.called).to.be.false;
			expect(addBusinessHourToDepartmentsStub.called).to.be.false;
		});

		it('should unlink all departments when departmentsToApplyBusinessHour is an empty string', async () => {
			linkedDepartmentsStub.resolves([{ _id: 'dept1' }, { _id: 'dept2' }]);

			await customBusinessHour.saveBusinessHour({ ...baseBusinessHour, _id: 'bh-id', departmentsToApplyBusinessHour: '' });

			expect(removeBusinessHourFromDepartmentsStub.calledOnceWith(['dept1', 'dept2'], 'bh-id')).to.be.true;
			expect(addBusinessHourToDepartmentsStub.called).to.be.false;
		});

		it('should reconcile department links when departmentsToApplyBusinessHour is provided', async () => {
			linkedDepartmentsStub.resolves([{ _id: 'dept1' }, { _id: 'dept2' }]);

			await customBusinessHour.saveBusinessHour({ ...baseBusinessHour, _id: 'bh-id', departmentsToApplyBusinessHour: 'dept1,dept3' });

			expect(removeBusinessHourFromDepartmentsStub.calledOnceWith(['dept2'], 'bh-id')).to.be.true;
			expect(addBusinessHourToDepartmentsStub.calledOnceWith(['dept3'], 'bh-id')).to.be.true;
		});
	});
});
