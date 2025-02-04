import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, api, credentials } from '../../../data/api-data';
import {
	createAgent,
	makeAgentAvailable,
	createDepartment,
	createVisitor,
	createLivechatRoom,
	getLivechatRoomInfo,
	makeAgentUnavailable,
	switchLivechatStatus,
} from '../../../data/livechat/rooms';
import { sleep } from '../../../data/livechat/utils';
import { updateSetting } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, login, setUserActiveStatus, setUserAway, setUserStatus } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Omnichannel - Routing', () => {
	before((done) => getCredentials(done));

	after(async () => {
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
	});

	// Basically: if there's a bot in the department, it should be assigned to the conversation
	// No matter what settings workspace has in, as long as the setting to assign new conversations to bots is enabled
	describe('Bots - Manual selection', () => {
		let botUser: { user: IUser; credentials: Credentials };
		let testDepartment: ILivechatDepartment;
		let testDepartment2: ILivechatDepartment;
		before(async () => {
			const bot = await createUser({ roles: ['bot', 'livechat-agent'] });
			const credentials = await login(bot.username, password);

			botUser = { user: bot, credentials };
		});
		before(async () => {
			testDepartment = await createDepartment([{ agentId: botUser.user._id }]);
			testDepartment2 = await createDepartment();
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			await updateSetting('Livechat_assign_new_conversation_to_bot', true);
			await updateSetting('Livechat_accept_chats_with_no_agents', true);
		});

		after(async () => {
			await deleteUser(botUser.user);
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			await updateSetting('Livechat_accept_chats_with_no_agents', false);
		});

		it('should assign conversation to bot', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy?._id).to.be.equal(botUser.user._id);
		});
		it('should not assign conversation to bot if department has no bots', async () => {
			const visitor = await createVisitor(testDepartment2._id);
			const room = await createLivechatRoom(visitor.token);

			expect(room.servedBy).to.be.undefined;
		});

		describe('with setting disabled', () => {
			before(async () => {
				await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			});
			after(async () => {
				await updateSetting('Livechat_assign_new_conversation_to_bot', true);
			});

			it('should not assign conversation to bot', async () => {
				const visitor = await createVisitor(testDepartment._id);
				const room = await createLivechatRoom(visitor.token);

				expect(room.servedBy).to.be.undefined;
			});
		});
	});

	describe('Bots - Auto selection', () => {
		let botUser: { user: IUser; credentials: Credentials };
		let otherUser: { user: IUser; credentials: Credentials };
		let testDepartment: ILivechatDepartment;
		let testDepartment2: ILivechatDepartment;
		before(async () => {
			const bot = await createUser({ roles: ['bot', 'livechat-agent'] });
			const credentials = await login(bot.username, password);

			const other = await createUser({ roles: ['livechat-agent'] });
			const otherCredentials = await login(other.username, password);

			await makeAgentAvailable(otherCredentials);

			botUser = { user: bot, credentials };
			otherUser = { user: other, credentials: otherCredentials };
		});
		before(async () => {
			testDepartment = await createDepartment([{ agentId: botUser.user._id }, { agentId: otherUser.user._id }]);
			testDepartment2 = await createDepartment();
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			await updateSetting('Livechat_assign_new_conversation_to_bot', true);
			await updateSetting('Livechat_accept_chats_with_no_agents', true);
		});

		after(async () => {
			await deleteUser(botUser.user);
			await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			await updateSetting('Livechat_accept_chats_with_no_agents', false);
		});

		it('should assign conversation to bot', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy?._id).to.be.equal(botUser.user._id);
		});
		it('should not assign conversation to bot if department has no bots', async () => {
			const visitor = await createVisitor(testDepartment2._id);
			const room = await createLivechatRoom(visitor.token);

			expect(room.servedBy).to.be.undefined;
		});

		describe('with setting disabled', () => {
			before(async () => {
				await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			});
			after(async () => {
				await updateSetting('Livechat_assign_new_conversation_to_bot', true);
			});

			it('should not assign conversation to bot', async () => {
				const visitor = await createVisitor(testDepartment._id);
				const room = await createLivechatRoom(visitor.token);

				expect(room.servedBy?._id).to.be.equal(otherUser.user._id);
			});
		});
	});

	describe('Bots - Auto selection & Waiting queue', () => {
		let botUser: { user: IUser; credentials: Credentials };
		let testDepartment: ILivechatDepartment;
		let testDepartment2: ILivechatDepartment;
		before(async () => {
			const bot = await createUser({ roles: ['bot', 'livechat-agent'] });
			const credentials = await login(bot.username, password);

			botUser = { user: bot, credentials };
		});
		before(async () => {
			testDepartment = await createDepartment([{ agentId: botUser.user._id }]);
			testDepartment2 = await createDepartment();
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			await updateSetting('Livechat_waiting_queue', true);
			await updateSetting('Livechat_assign_new_conversation_to_bot', true);
			await updateSetting('Livechat_accept_chats_with_no_agents', true);
		});

		after(async () => {
			await deleteUser(botUser.user);
			await updateSetting('Livechat_waiting_queue', false);
			await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			await updateSetting('Livechat_accept_chats_with_no_agents', false);
		});

		it('should assign conversation to bot', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy?._id).to.be.equal(botUser.user._id);
		});
		it('should not assign conversation to bot if department has no bots', async () => {
			const visitor = await createVisitor(testDepartment2._id);
			const room = await createLivechatRoom(visitor.token);

			expect(room.servedBy).to.be.undefined;
		});

		describe('with setting disabled', () => {
			before(async () => {
				await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			});
			after(async () => {
				await updateSetting('Livechat_assign_new_conversation_to_bot', true);
			});

			it('should not assign conversation to bot', async () => {
				const visitor = await createVisitor(testDepartment._id);
				const room = await createLivechatRoom(visitor.token);

				expect(room.servedBy).to.be.undefined;
			});
		});
	});

	describe('Auto-Selection', () => {
		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
		});

		let testUser: { user: IUser; credentials: Credentials };
		let testUser2: { user: IUser; credentials: Credentials };
		let testUser3: { user: IUser; credentials: Credentials };
		let testDepartment: ILivechatDepartment;
		let visitorEmail: string;

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
			const user = await createUser();
			await createAgent(user.username);
			const credentials3 = await login(user.username, password);
			await makeAgentAvailable(credentials3);

			testUser3 = {
				user,
				credentials: credentials3,
			};
		});

		before(async () => {
			testDepartment = await createDepartment([{ agentId: testUser.user._id }, { agentId: testUser3.user._id }]);

			const visitorName = faker.person.fullName();
			visitorEmail = faker.internet.email().toLowerCase();
			await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: visitorName,
					emails: [visitorEmail],
					phones: [],
					contactManager: testUser3.user._id,
				});
		});

		after(async () =>
			Promise.all([
				deleteUser(testUser.user),
				deleteUser(testUser2.user),
				deleteUser(testUser3.user),
				updateSetting('Livechat_enabled_when_agent_idle', true),
			]),
		);

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
		it('should route to contact manager if it is online and Omnichannel_contact_manager_routing is enabled', async () => {
			const visitor = await createVisitor(testDepartment._id, faker.person.fullName(), visitorEmail);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser3.user._id);
		});
		it('should fail to start a conversation if there is noone available and Livechat_accept_chats_with_no_agents is false', async () => {
			await updateSetting('Livechat_accept_chats_with_no_agents', false);
			await makeAgentUnavailable(testUser.credentials);
			await makeAgentUnavailable(testUser3.credentials);

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
		it('should not route to an idle user', async () => {
			await setUserStatus(testUser.credentials, UserStatus.AWAY);
			await setUserAway(testUser.credentials);
			await setUserStatus(testUser3.credentials, UserStatus.AWAY);
			await setUserAway(testUser3.credentials);
			// Agent is available but should be ignored
			await switchLivechatStatus('available', testUser.credentials);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);
			expect(roomInfo.servedBy).to.be.undefined;
		});
		it('should route to an idle user', async () => {
			await updateSetting('Livechat_enabled_when_agent_idle', true);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);
			expect(roomInfo.servedBy).to.be.an('object');
		});
		it('should route to another available agent if contact manager is unavailable and Omnichannel_contact_manager_routing is enabled', async () => {
			await makeAgentAvailable(testUser.credentials);
			const visitor = await createVisitor(testDepartment._id, faker.person.fullName(), visitorEmail);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
		});
		describe('with setting Omnichannel_contact_manager_routing disabled', () => {
			let testDepartment2: ILivechatDepartment;
			before(async () => {
				await updateSetting('Omnichannel_contact_manager_routing', false);
				// We should update the count of the user
			});
			after(async () => {
				await updateSetting('Omnichannel_contact_manager_routing', true);
			});

			before(async () => {
				// This will deprioritize the CM from normal routing. So the test is predictable
				// IF the setting is off, the CM will be treated as a normal agent
				// IF the setting is on, the CM will be treated as a CM and no matter the count it will get assigned
				testDepartment2 = await createDepartment([{ agentId: testUser.user._id }, { agentId: testUser3.user._id, count: 10000 }]);

				const visitorName = faker.person.fullName();
				visitorEmail = faker.internet.email().toLowerCase();
				await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: visitorName,
						emails: [visitorEmail],
						phones: [],
						contactManager: testUser3.user._id,
					});
			});

			it('should not route to contact manager if it is online but setting is off', async () => {
				const visitor = await createVisitor(testDepartment2._id, faker.person.fullName(), visitorEmail);
				const room = await createLivechatRoom(visitor.token);

				await sleep(5000);

				const roomInfo = await getLivechatRoomInfo(room._id);

				expect(roomInfo.servedBy).to.be.an('object').that.has.property('_id').that.is.not.equal(testUser3.user._id);
			});
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
		it('should not route to an idle user', async () => {
			await updateSetting('Livechat_enabled_when_agent_idle', false);
			await setUserStatus(testUser.credentials, UserStatus.AWAY);
			await setUserAway(testUser.credentials);
			await setUserStatus(testUser2.credentials, UserStatus.AWAY);
			await setUserAway(testUser2.credentials);
			// Agent is available but should be ignored
			await switchLivechatStatus('available', testUser.credentials);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);
			expect(roomInfo.servedBy).to.be.undefined;
		});
		it('should route to agents even if theyre idle when setting is enabled', async () => {
			await updateSetting('Livechat_enabled_when_agent_idle', true);
			await setUserStatus(testUser.credentials, UserStatus.AWAY);
			await setUserStatus(testUser2.credentials, UserStatus.AWAY);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);
			// Not checking who, just checking it's served
			expect(roomInfo.servedBy).to.be.an('object');
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
		it('should not route to an idle user', async () => {
			await updateSetting('Livechat_enabled_when_agent_idle', false);
			await setUserStatus(testUser.credentials, UserStatus.AWAY);
			await setUserAway(testUser.credentials);
			await setUserStatus(testUser2.credentials, UserStatus.AWAY);
			await setUserAway(testUser2.credentials);
			// Agent is available but should be ignored
			await switchLivechatStatus('available', testUser.credentials);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);
			expect(roomInfo.servedBy).to.be.undefined;
		});
		it('should route to agents even if theyre idle when setting is enabled', async () => {
			await updateSetting('Livechat_enabled_when_agent_idle', true);
			await setUserStatus(testUser.credentials, UserStatus.AWAY);
			await setUserStatus(testUser2.credentials, UserStatus.AWAY);

			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const roomInfo = await getLivechatRoomInfo(room._id);
			// Not checking who, just checking it's served
			expect(roomInfo.servedBy).to.be.an('object');
		});
	});
});
