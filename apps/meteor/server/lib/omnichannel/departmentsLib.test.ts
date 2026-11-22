import { before, beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatDepartment: {
		findOneById: sinon.stub(),
		countDepartmentsInUnit: sinon.stub(),
		createOrUpdateDepartment: sinon.stub(),
	},
};

const callbacksRun = sinon.stub();
const triggerEvent = sinon.stub();
const isDepartmentCreationAvailable = sinon.stub();
const updateDepartmentAgents = sinon.stub();
const notifyOnLivechatDepartmentAgentChangedByDepartmentId = sinon.stub();

const { saveDepartment } = proxyquire.noCallThru().load('./departmentsLib', {
	'@rocket.chat/apps': {
		Apps: { self: { triggerEvent } },
		AppEvents: { IPostLivechatDepartmentDisabled: 'IPostLivechatDepartmentDisabled' },
	},
	'@rocket.chat/core-services': { ClientSafeError },
	'@rocket.chat/omni-core': { isDepartmentCreationAvailable },
	'./Helper': { updateDepartmentAgents },
	'./hooks': { afterDepartmentArchived: sinon.stub(), afterDepartmentUnarchived: sinon.stub() },
	'./logger': { livechatLogger: { debug: sinon.stub() } },
	'../../settings': { settings: { get: sinon.stub() } },
	'../callbacks': { callbacks: { run: callbacksRun } },
	'../notifyListener': {
		notifyOnLivechatDepartmentAgentChangedByDepartmentId,
		notifyOnLivechatDepartmentAgentChanged: sinon.stub(),
	},
});

describe('saveDepartment', () => {
	before(() => {
		mockModel('LivechatDepartment', modelsMock.LivechatDepartment);
	});

	beforeEach(() => {
		Object.values(modelsMock.LivechatDepartment).forEach((stub) => stub.reset());
		[
			callbacksRun,
			triggerEvent,
			isDepartmentCreationAvailable,
			updateDepartmentAgents,
			notifyOnLivechatDepartmentAgentChangedByDepartmentId,
		].forEach((stub) => stub.reset());

		modelsMock.LivechatDepartment.findOneById
			.withArgs('dep-id')
			.resolves({ _id: 'dep-id', enabled: true, archived: false, parentId: 'unit-id' });
		modelsMock.LivechatDepartment.createOrUpdateDepartment.resolves({ _id: 'dep-id', enabled: true });
		isDepartmentCreationAvailable.resolves(true);
	});

	it('should throw when the unit id is not a string', async () => {
		await expect(saveDepartment('user-id', 'dep-id', { enabled: true }, undefined, { _id: 10 })).to.be.rejectedWith(
			'Invalid department unit id provided',
		);
		expect(modelsMock.LivechatDepartment.findOneById.notCalled).to.be.true;
	});

	it('should load the existing department with the fields it checks', async () => {
		await saveDepartment('user-id', 'dep-id', { enabled: true });

		expect(
			modelsMock.LivechatDepartment.findOneById.calledOnceWithExactly('dep-id', {
				projection: { _id: 1, archived: 1, enabled: 1, parentId: 1 },
			}),
		).to.be.true;
	});

	it('should throw when removing the last department of its unit', async () => {
		modelsMock.LivechatDepartment.countDepartmentsInUnit.resolves(1);

		await expect(saveDepartment('user-id', 'dep-id', { enabled: true }, undefined, {})).to.be.rejectedWith(
			"The last department in a unit can't be removed",
		);
		expect(modelsMock.LivechatDepartment.countDepartmentsInUnit.calledOnceWithExactly('unit-id')).to.be.true;
		expect(isDepartmentCreationAvailable.notCalled).to.be.true;
		expect(modelsMock.LivechatDepartment.createOrUpdateDepartment.notCalled).to.be.true;
	});

	it('should throw an error-unit-cant-be-empty error for the client', async () => {
		modelsMock.LivechatDepartment.countDepartmentsInUnit.resolves(1);

		const error = await saveDepartment('user-id', 'dep-id', { enabled: true }, undefined, {}).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.have.property('error', 'error-unit-cant-be-empty');
	});

	it('should remove the department from its unit when the unit has other departments', async () => {
		modelsMock.LivechatDepartment.countDepartmentsInUnit.resolves(2);

		await saveDepartment('user-id', 'dep-id', { enabled: true }, undefined, {});

		expect(modelsMock.LivechatDepartment.countDepartmentsInUnit.calledOnceWithExactly('unit-id')).to.be.true;
		expect(
			callbacksRun.calledOnceWithExactly('livechat.manageDepartmentUnit', { userId: 'user-id', departmentId: 'dep-id', unitId: undefined }),
		).to.be.true;
	});

	it('should not count unit departments when the department has no unit', async () => {
		modelsMock.LivechatDepartment.findOneById.withArgs('dep-id').resolves({ _id: 'dep-id', enabled: true });

		await saveDepartment('user-id', 'dep-id', { enabled: true }, undefined, {});

		expect(modelsMock.LivechatDepartment.countDepartmentsInUnit.notCalled).to.be.true;
	});

	it('should not count unit departments when the department is moved to another unit', async () => {
		await saveDepartment('user-id', 'dep-id', { enabled: true }, undefined, { _id: 'other-unit' });

		expect(modelsMock.LivechatDepartment.countDepartmentsInUnit.notCalled).to.be.true;
		expect(
			callbacksRun.calledOnceWithExactly('livechat.manageDepartmentUnit', {
				userId: 'user-id',
				departmentId: 'dep-id',
				unitId: 'other-unit',
			}),
		).to.be.true;
	});

	it('should not count unit departments when no unit is given', async () => {
		await saveDepartment('user-id', 'dep-id', { enabled: true });

		expect(modelsMock.LivechatDepartment.countDepartmentsInUnit.notCalled).to.be.true;
		expect(callbacksRun.calledWith('livechat.manageDepartmentUnit')).to.be.false;
	});

	it('should not count unit departments when creating a department', async () => {
		await saveDepartment('user-id', null, { enabled: true }, undefined, {});

		expect(modelsMock.LivechatDepartment.findOneById.notCalled).to.be.true;
		expect(modelsMock.LivechatDepartment.countDepartmentsInUnit.notCalled).to.be.true;
	});

	it('should throw when no more departments can be created', async () => {
		isDepartmentCreationAvailable.resolves(false);

		await expect(saveDepartment('user-id', null, { enabled: true })).to.be.rejectedWith('Maximum number of departments reached');
		expect(modelsMock.LivechatDepartment.createOrUpdateDepartment.notCalled).to.be.true;
	});

	it('should not check the department limit when updating a department', async () => {
		await saveDepartment('user-id', 'dep-id', { enabled: true });

		expect(isDepartmentCreationAvailable.notCalled).to.be.true;
	});

	it('should throw when enabling an archived department', async () => {
		modelsMock.LivechatDepartment.findOneById.withArgs('dep-id').resolves({ _id: 'dep-id', archived: true, enabled: false });

		await expect(saveDepartment('user-id', 'dep-id', { enabled: true })).to.be.rejectedWith('Archived departments cant be enabled');
	});

	it('should throw when closing tags are required but none are given', async () => {
		await expect(
			saveDepartment('user-id', 'dep-id', { enabled: true, requestTagBeforeClosingChat: true, chatClosingTags: [] }),
		).to.be.rejectedWith('At least one closing tag is required when the department requires tag(s) on closing conversations.');
	});

	it('should throw when the department to update does not exist', async () => {
		await expect(saveDepartment('user-id', 'missing-id', { enabled: true })).to.be.rejectedWith('Department not found');
		expect(isDepartmentCreationAvailable.calledOnce).to.be.true;
	});

	it('should report the department limit before a missing department', async () => {
		isDepartmentCreationAvailable.resolves(false);

		await expect(saveDepartment('user-id', 'missing-id', { enabled: true })).to.be.rejectedWith('Maximum number of departments reached');
	});

	it('should throw when the department is its own fallback', async () => {
		await expect(saveDepartment('user-id', 'dep-id', { enabled: true, fallbackForwardDepartment: 'dep-id' })).to.be.rejectedWith(
			'Cannot save department. Circular reference between fallback department and department',
		);
	});

	it('should throw when the fallback department does not exist', async () => {
		await expect(saveDepartment('user-id', 'dep-id', { enabled: true, fallbackForwardDepartment: 'missing-id' })).to.be.rejectedWith(
			'Fallback department not found',
		);
		expect(modelsMock.LivechatDepartment.findOneById.calledWithExactly('missing-id', { projection: { _id: 1 } })).to.be.true;
		expect(modelsMock.LivechatDepartment.createOrUpdateDepartment.notCalled).to.be.true;
	});

	it('should save the department with its agents and return it', async () => {
		modelsMock.LivechatDepartment.findOneById.withArgs('fallback-id').resolves({ _id: 'fallback-id' });
		const data = { enabled: true, fallbackForwardDepartment: 'fallback-id' };
		const agents = { upsert: [{ agentId: 'agent-1' }] };

		const result = await saveDepartment('user-id', 'dep-id', data, agents);

		expect(result).to.deep.equal({ _id: 'dep-id', enabled: true });
		expect(modelsMock.LivechatDepartment.createOrUpdateDepartment.calledOnceWithExactly('dep-id', data)).to.be.true;
		expect(updateDepartmentAgents.calledOnceWithExactly('dep-id', agents, true)).to.be.true;
		expect(notifyOnLivechatDepartmentAgentChangedByDepartmentId.notCalled).to.be.true;
		expect(callbacksRun.notCalled).to.be.true;
		expect(triggerEvent.notCalled).to.be.true;
	});

	it('should not update agents when none are given', async () => {
		await saveDepartment('user-id', 'dep-id', { enabled: true });

		expect(updateDepartmentAgents.notCalled).to.be.true;
	});

	it('should notify agents as inserted when creating an enabled department', async () => {
		modelsMock.LivechatDepartment.createOrUpdateDepartment.resolves({ _id: 'new-id', enabled: true });

		await saveDepartment('user-id', null, { enabled: true });

		expect(modelsMock.LivechatDepartment.createOrUpdateDepartment.calledOnceWithExactly(null, { enabled: true })).to.be.true;
		expect(notifyOnLivechatDepartmentAgentChangedByDepartmentId.calledOnceWithExactly('new-id', 'inserted')).to.be.true;
	});

	it('should run the disabled hooks when disabling a department', async () => {
		const disabled = { _id: 'dep-id', enabled: false };
		modelsMock.LivechatDepartment.createOrUpdateDepartment.resolves(disabled);

		await saveDepartment('user-id', 'dep-id', { enabled: false });

		expect(notifyOnLivechatDepartmentAgentChangedByDepartmentId.calledOnceWithExactly('dep-id', 'updated')).to.be.true;
		expect(callbacksRun.calledOnceWithExactly('livechat.afterDepartmentDisabled', disabled)).to.be.true;
		expect(triggerEvent.calledOnceWithExactly('IPostLivechatDepartmentDisabled', { department: disabled })).to.be.true;
	});
});
