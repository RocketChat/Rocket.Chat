import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const livechatDepartmentStub = {
	findOneById: sinon.stub(),
	addDepartmentToUnit: sinon.stub(),
	removeDepartmentFromUnit: sinon.stub(),
};

const livechatUnitStub = {
	findOneById: sinon.stub(),
	decrementDepartmentsCount: sinon.stub(),
	incrementDepartmentsCount: sinon.stub(),
};

const hasAnyRoleStub = sinon.stub();
const getUnitsFromUserStub = sinon.stub();

const { manageDepartmentUnit } = proxyquire
	.noCallThru()
	.load('../../../../../../app/livechat-enterprise/server/hooks/manageDepartmentUnit.ts', {
		'../methods/getUnitsFromUserRoles': {
			getUnitsFromUser: getUnitsFromUserStub,
		},
		'../../../../../app/authorization/server/functions/hasRole': {
			hasAnyRoleAsync: hasAnyRoleStub,
		},
		'@rocket.chat/models': {
			LivechatDepartment: livechatDepartmentStub,
			LivechatUnit: livechatUnitStub,
		},
	});

describe('hooks/manageDepartmentUnit', () => {
	beforeEach(() => {
		livechatDepartmentStub.findOneById.reset();
		livechatDepartmentStub.addDepartmentToUnit.reset();
		livechatDepartmentStub.removeDepartmentFromUnit.reset();
		livechatUnitStub.findOneById.reset();
		livechatUnitStub.decrementDepartmentsCount.reset();
		livechatUnitStub.incrementDepartmentsCount.reset();
		hasAnyRoleStub.reset();
	});

	it('should not perform any operation when an invalid department is provided', async () => {
		livechatDepartmentStub.findOneById.resolves(null);
		hasAnyRoleStub.resolves(true);
		getUnitsFromUserStub.resolves(['unit-id']);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.notCalled).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.notCalled).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.notCalled).to.be.true;
	});

	it('should not perform any operation if the provided department is already in unit', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		hasAnyRoleStub.resolves(true);
		getUnitsFromUserStub.resolves(['unit-id']);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.notCalled).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.notCalled).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.notCalled).to.be.true;
	});

	it("should not perform any operation if user is a monitor and can't manage new unit", async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		hasAnyRoleStub.resolves(false);
		getUnitsFromUserStub.resolves(['unit-id']);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'new-unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.notCalled).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.notCalled).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.notCalled).to.be.true;
	});

	it("should not perform any operation if user is a monitor and can't manage current unit", async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		hasAnyRoleStub.resolves(false);
		getUnitsFromUserStub.resolves(['new-unit-id']);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'new-unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.notCalled).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.notCalled).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.notCalled).to.be.true;
	});

	it('should not perform any operation if user is an admin/manager but an invalid unit is provided', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		livechatUnitStub.findOneById.resolves(undefined);
		hasAnyRoleStub.resolves(true);
		getUnitsFromUserStub.resolves(undefined);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'new-unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.notCalled).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.notCalled).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.notCalled).to.be.true;
	});

	it('should remove department from its current unit if user is an admin/manager', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		hasAnyRoleStub.resolves(true);
		getUnitsFromUserStub.resolves(undefined);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: undefined });
		expect(livechatDepartmentStub.addDepartmentToUnit.notCalled).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.notCalled).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.calledOnceWith('department-id')).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.calledOnceWith('unit-id')).to.be.true;
	});

	it('should add department to a unit if user is an admin/manager', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id' });
		livechatUnitStub.findOneById.resolves({ _id: 'unit-id' });
		hasAnyRoleStub.resolves(true);
		getUnitsFromUserStub.resolves(undefined);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.calledOnceWith('department-id', 'unit-id', ['unit-id'])).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.calledOnceWith('unit-id')).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.notCalled).to.be.true;
	});

	it('should move department to a new unit if user is an admin/manager', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		livechatUnitStub.findOneById.resolves({ _id: 'new-unit-id' });
		hasAnyRoleStub.resolves(true);
		getUnitsFromUserStub.resolves(undefined);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'new-unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.calledOnceWith('department-id', 'new-unit-id', ['new-unit-id'])).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.calledOnceWith('new-unit-id')).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.calledOnceWith('unit-id')).to.be.true;
	});

	it('should remove department from its current unit if user is a monitor that supervises the current unit', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		hasAnyRoleStub.resolves(false);
		getUnitsFromUserStub.resolves(['unit-id']);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: undefined });
		expect(livechatDepartmentStub.addDepartmentToUnit.notCalled).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.notCalled).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.calledOnceWith('department-id')).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.calledOnceWith('unit-id')).to.be.true;
	});

	it('should add department to a unit if user is a monitor that supervises the new unit', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id' });
		livechatUnitStub.findOneById.resolves({ _id: 'unit-id' });
		hasAnyRoleStub.resolves(false);
		getUnitsFromUserStub.resolves(['unit-id']);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.calledOnceWith('department-id', 'unit-id', ['unit-id'])).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.calledOnceWith('unit-id')).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.notCalled).to.be.true;
	});

	it('should move department to a new unit if user is a monitor that supervises the current and new units', async () => {
		livechatDepartmentStub.findOneById.resolves({ _id: 'department-id', ancestors: ['unit-id'], parentId: 'unit-id' });
		livechatUnitStub.findOneById.resolves({ _id: 'unit-id' });
		hasAnyRoleStub.resolves(false);
		getUnitsFromUserStub.resolves(['unit-id', 'new-unit-id']);

		await manageDepartmentUnit({ userId: 'user-id', departmentId: 'department-id', unitId: 'new-unit-id' });
		expect(livechatDepartmentStub.addDepartmentToUnit.calledOnceWith('department-id', 'new-unit-id', ['new-unit-id'])).to.be.true;
		expect(livechatUnitStub.incrementDepartmentsCount.calledOnceWith('new-unit-id')).to.be.true;
		expect(livechatDepartmentStub.removeDepartmentFromUnit.notCalled).to.be.true;
		expect(livechatUnitStub.decrementDepartmentsCount.calledOnceWith('unit-id')).to.be.true;
	});
});
