import type { Credentials } from '@rocket.chat/api-client';
import { UserStatus, type ILivechatDepartment, type IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, api } from '../../../data/api-data';
import {
	createAgent,
	makeAgentAvailable,
	createDepartment,
	createVisitor,
	createLivechatRoom,
	getLivechatRoomInfo,
	makeAgentUnavailable,
} from '../../../data/livechat/rooms';
import { sleep } from '../../../data/livechat/utils';
import { updateSetting } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, login, setUserActiveStatus, setUserStatus } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Omnichannel - Routing', () => {
	before((done) => getCredentials(done));

	after(async () => {
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
	});

	describe('Auto-Selection', () => {
		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
		});

		let testUser: { user: IUser; credentials: Credentials };
		let testUser2: { user: IUser; credentials: Credentials };
		let testDepartment: ILivechatDepartment;

		before(async () => {
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentAvailable(credentials2);

			testUser = {
				user,
				credentials: credentials2,
			};
		});

		before(async () => {
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentUnavailable(credentials2);

			testUser2 = {
				user,
				credentials: credentials2,
			};
		});

		before(async () => {
			testDepartment = await createDepartment([{ agentId: testUser.user._id }]);
		});

		after(async () => {
			await deleteUser(testUser.user);
			await deleteUser(testUser2.user);
		});

		it('should route a room to an available agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
			expect(roomInfo.servedBy?._id).to.not.be.equal(testUser2.user._id);
		});
		it('should not route to a not-available agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.not.be.equal(testUser2.user._id);
		});
		it('should fail to start a conversation if there is noone available and Livechat_accept_chats_with_no_agents is false', async () => {
			await updateSetting('Livechat_accept_chats_with_no_agents', false);
			await makeAgentUnavailable(testUser.credentials);

			const visitor = await createVisitor(testDepartment._id);
			const { body } = await request.get(api('livechat/room')).query({ token: visitor.token }).expect(400);
			expect(body.error).to.be.equal('Sorry, no online agents [no-agent-online]');
		});
		it('should accept a conversation but not route to anyone when Livechat_accept_chats_with_no_agents is true', async () => {
			await updateSetting('Livechat_accept_chats_with_no_agents', true);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.undefined;
		});
		it('should not allow users to take more than Livechat_maximum_chats_per_agent chats', async () => {
			await updateSetting('Livechat_maximum_chats_per_agent', 2);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.undefined;
		});
		it('should ignore disabled users', async () => {
			await updateSetting('Livechat_maximum_chats_per_agent', 0);
			await setUserActiveStatus(testUser2.user._id, false);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);
			expect(roomInfo.servedBy).to.be.undefined;
		});
		it('should ignore offline users when Livechat_enabled_when_agent_idle is false', async () => {
			await updateSetting('Livechat_enabled_when_agent_idle', false);
			await setUserStatus(testUser.credentials, UserStatus.OFFLINE);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);
			expect(roomInfo.servedBy).to.be.undefined;
		});
	});
	describe('Load Balancing', () => {
		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Load_Balancing');
		});

		let testUser: { user: IUser; credentials: Credentials };
		let testUser2: { user: IUser; credentials: Credentials };
		let testDepartment: ILivechatDepartment;

		before(async () => {
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentAvailable(credentials2);

			testUser = {
				user,
				credentials: credentials2,
			};
		});

		before(async () => {
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentUnavailable(credentials2);

			testUser2 = {
				user,
				credentials: credentials2,
			};
		});

		before(async () => {
			testDepartment = await createDepartment([{ agentId: testUser.user._id }, { agentId: testUser2.user._id }]);
		});

		after(async () => {
			await deleteUser(testUser.user);
			await deleteUser(testUser2.user);
		});

		it('should route a room to an available agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
			expect(roomInfo.servedBy?._id).to.not.be.equal(testUser2.user._id);
		});
		it('should not route to a not-available agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.not.be.equal(testUser2.user._id);
		});
		it('should route the chat to the less busy agent when both are available', async () => {
			await makeAgentAvailable(testUser2.credentials);
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser2.user._id);
		});
		it('should route again to the less busy agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser2.user._id);
		});
	});
	describe('Load Rotation', () => {
		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Load_Rotation');
		});

		let testUser: { user: IUser; credentials: Credentials };
		let testUser2: { user: IUser; credentials: Credentials };
		let testDepartment: ILivechatDepartment;

		before(async () => {
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentAvailable(credentials2);

			testUser = {
				user,
				credentials: credentials2,
			};
		});

		before(async () => {
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentUnavailable(credentials2);

			testUser2 = {
				user,
				credentials: credentials2,
			};
		});

		before(async () => {
			testDepartment = await createDepartment([{ agentId: testUser.user._id }, { agentId: testUser2.user._id }]);
		});

		after(async () => {
			await deleteUser(testUser.user);
			await deleteUser(testUser2.user);
		});

		it('should route a room to an available agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
			expect(roomInfo.servedBy?._id).to.not.be.equal(testUser2.user._id);
		});
		it('should not route chat to an unavailable agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.not.be.equal(testUser2.user._id);
		});
		it('should route the chat to the agent with the oldest routing time when both are available', async () => {
			await makeAgentAvailable(testUser2.credentials);
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser2.user._id);
		});
		it('should route again to the agent with the oldest routing time', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
		});
	});
});
