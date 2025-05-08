import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingGetMock = sinon.stub();
const usersModelMock = {
	getAgentInfo: sinon.stub(),
};

const departmentsMock = { findOneById: sinon.stub() };

const mocks = {
	'meteor/meteor': { Meteor: { startup: sinon.stub() } },
	'./QueueInactivityMonitor': { stop: sinon.stub() },
	'../../../../../app/livechat/server/lib/settings': { getInquirySortMechanismSetting: sinon.stub() },
	'../../../../../app/livechat/lib/inquiries': { getOmniChatSortQuery: sinon.stub() },
	'../../../../../app/settings/server': { settings: { get: settingGetMock } },
	'@rocket.chat/models': { Users: usersModelMock, LivechatDepartment: departmentsMock },
};

const { isAgentWithinChatLimits } = proxyquire.noCallThru().load('../../../../../app/livechat-enterprise/server/lib/Helper.ts', mocks);

describe('isAgentWithinChatLimits', () => {
	beforeEach(() => {
		usersModelMock.getAgentInfo.reset();
		departmentsMock.findOneById.reset();
		settingGetMock.reset();
	});
	it('should return true if no limit is set', async () => {
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 10 });
		expect(res).to.be.true;
	});
	it('should return true when agent is under the agent limit', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: 15 } });
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 10 });
		expect(res).to.be.true;
	});
	it('should honor agent limit over global limit', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: 15 } });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 10 });
		expect(res).to.be.true;
	});
	it('should use global limit if agent limit is not set', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: undefined } });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 10 });
		expect(res).to.be.false;
	});
	it('should consider a user with the same number of chats as the limit as over the limit', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: 15 } });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 15 });
		expect(res).to.be.false;
	});
	it('should honor both department and agent limit when departmentId is passed', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: 15 } });
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 10 });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 10, departmentId: 'dept1', departmentChats: 5 });
		expect(res).to.be.true;
	});
	it('should return false for a user under their agent limit but above their department limit', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: 15 } });
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 10 });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11, departmentId: 'dept1', departmentChats: 11 });
		expect(res).to.be.false;
	});
	it('should return false for a user under their department limit but above their agent limit', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: 10 } });
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 15 });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11, departmentId: 'dept1', departmentChats: 10 });
		expect(res).to.be.false;
	});
	it('should honor both department and global when agent limit is not set', async () => {
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 15 });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11, departmentId: 'dept1', departmentChats: 10 });
		expect(res).to.be.false;
	});
	it('should return false for a user under their global limit but above their department limit', async () => {
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 10 });
		settingGetMock.returns(20);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11, departmentId: 'dept1', departmentChats: 11 });
		expect(res).to.be.false;
	});
	it('should return false for a user under their department limit but above the global limit', async () => {
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 10 });
		settingGetMock.returns(5);
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11, departmentId: 'dept1', departmentChats: 3 });
		expect(res).to.be.false;
	});
	it('should apply only the department limit if the other 2 limits are not set', async () => {
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 10 });
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11, departmentId: 'dept1', departmentChats: 3 });
		expect(res).to.be.true;
	});
	it('should ignore agent limit if its not a valid number (or cast to number)', async () => {
		usersModelMock.getAgentInfo.resolves({ livechat: { maxNumberSimultaneousChat: 'invalid' } });
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11 });
		expect(res).to.be.true;
	});
	it('should ignore the department limit if it is not a valid number (or cast to number)', async () => {
		departmentsMock.findOneById.resolves({ maxNumberSimultaneousChat: 'invalid' });
		const res = await isAgentWithinChatLimits({ agentId: 'kevs', totalChats: 11, departmentId: 'dept1', departmentChats: 11 });
		expect(res).to.be.true;
	});
});
