import type { Credentials } from '@rocket.chat/api-client';
import { UserStatus, type ILivechatAgent, type ILivechatDepartment, type IRoom, type IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { disableDefaultBusinessHour, makeDefaultBusinessHourActiveAndClosed } from '../../../data/livechat/businessHours';
import { createDepartment, deleteDepartment } from '../../../data/livechat/department';
import {
	createAgent,
	createManager,
	createVisitor,
	createLivechatRoom,
	takeInquiry,
	fetchInquiry,
	makeAgentAvailable,
	startANewLivechatRoomAndTakeIt,
	moveBackToQueue,
	closeOmnichannelRoom,
} from '../../../data/livechat/rooms';
import { updateEESetting, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, getMe, login, setUserStatus } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - Agents', () => {
	let agent: ILivechatAgent;
	let manager: ILivechatAgent;

	let agent2: { user: IUser; credentials: Credentials };

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
		await updateEESetting('Livechat_Require_Contact_Verification', 'never');
		await updateSetting('Omnichannel_enable_department_removal', true);
		agent = await createAgent();
		manager = await createManager();
	});

	before(async () => {
		const user = await createUser();
		const userCredentials = await login(user.username, password);
		await createAgent(user.username);

		await makeAgentAvailable(userCredentials);

		agent2 = {
			user,
			credentials: userCredentials,
		};
	});

	after(async () => {
		await updateSetting('Omnichannel_enable_department_removal', false);
		await deleteUser(agent2.user);
	});

	// TODO: missing test cases for POST method
	describe('GET livechat/users/:type', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('edit-omnichannel-contact', []);
			await updatePermission('transfer-livechat-guest', []);
			await updatePermission('manage-livechat-agents', []);

			await request.get(api('livechat/users/agent')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should throw an error when the type is invalid', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			await updatePermission('manage-livechat-agents', ['admin']);

			await request
				.get(api('livechat/users/invalid-type'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Invalid type');
				});
		});
		it('should return an array of agents', async () => {
			await updatePermission('edit-omnichannel-contact', ['admin']);
			await updatePermission('transfer-livechat-guest', ['admin']);
			await updatePermission('manage-livechat-agents', ['admin']);

			await request
				.get(api('livechat/users/agent'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.users).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					const agentRecentlyCreated = (res.body.users as ILivechatAgent[]).find((user) => agent._id === user._id);
					expect(agentRecentlyCreated?._id).to.be.equal(agent._id);
				});
		});
		it('should return an array of available agents', async () => {
			await updatePermission('edit-omnichannel-contact', ['admin']);
			await updatePermission('transfer-livechat-guest', ['admin']);
			await updatePermission('manage-livechat-agents', ['admin']);

			await request
				.get(api('livechat/users/agent'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.query({ onlyAvailable: true })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.users).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.users.every((u: { statusLivechat: string }) => u.statusLivechat === 'available')).to.be.true;
				});
		});
		it('should return an array of available/unavailable agents when onlyAvailable is false', async () => {
			await request
				.get(api('livechat/users/agent'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.query({ onlyAvailable: false })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.users).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(
						res.body.users.every(
							(u: { statusLivechat: string }) => !u.statusLivechat || ['available', 'not-available'].includes(u.statusLivechat),
						),
					).to.be.true;
				});
		});

		it('should return offline agents when showIdleAgents is true', async () => {
			await setUserStatus(agent2.credentials, UserStatus.OFFLINE);
			await request
				.get(api('livechat/users/agent'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.query({ showIdleAgents: true })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.users).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(
						res.body.users.every(
							(u: { status: UserStatus }) =>
								!u.status || [UserStatus.ONLINE, UserStatus.OFFLINE, UserStatus.AWAY, UserStatus.BUSY].includes(u.status),
						),
					).to.be.true;
				});
		});

		it('should return only online agents when showIdleAgents is false', async () => {
			await setUserStatus(agent2.credentials, UserStatus.ONLINE);
			await request
				.get(api('livechat/users/agent'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.query({ showIdleAgents: false })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.users).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.users.every((u: { status: UserStatus }) => u.status !== UserStatus.OFFLINE)).to.be.true;
				});
		});

		it('should return an array of managers', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			await updatePermission('manage-livechat-agents', ['admin']);

			await request
				.get(api('livechat/users/manager'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.users).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					const managerRecentlyCreated = (res.body.users as ILivechatAgent[]).find((user) => manager._id === user._id);
					expect(managerRecentlyCreated?._id).to.be.equal(manager._id);
				});
		});
	});

	describe('POST livechat/users/:type', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);

			await request
				.post(api('livechat/users/agent'))
				.set(credentials)
				.send({
					username: 'test-agent',
				})
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should return an error when type is invalid', async () => {
			await updatePermission('view-livechat-manager', ['admin']);

			await request
				.post(api('livechat/users/invalid-type'))
				.set(credentials)
				.send({
					username: 'test-agent',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should return an error when username is invalid', async () => {
			await updatePermission('view-livechat-manager', ['admin']);

			await request
				.post(api('livechat/users/agent'))
				.set(credentials)
				.send({
					username: 'mr-not-valid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should return a valid user when all goes fine', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const user = await createUser();
			await request
				.post(api('livechat/users/agent'))
				.set(credentials)
				.send({
					username: user.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('user');
					expect(res.body.user).to.have.property('_id');
					expect(res.body.user).to.have.property('username');
				});

			// cleanup
			await deleteUser(user);
		});

		it('should properly create a manager', async () => {
			const user = await createUser();
			await request
				.post(api('livechat/users/manager'))
				.set(credentials)
				.send({
					username: user.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('user');
					expect(res.body.user).to.have.property('_id');
					expect(res.body.user).to.have.property('username');
				});

			// cleanup
			await deleteUser(user);
		});
	});

	describe('GET livechat/users/:type/:_id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);

			await request
				.get(api(`livechat/users/agent/id${agent._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		}).timeout(5000);

		it('should return an error when type is invalid', async () => {
			await updatePermission('view-livechat-manager', ['admin']);

			await request
				.get(api(`livechat/users/invalid-type/invalid-id${agent._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		}).timeout(5000);

		it('should return an error when _id is invalid', async () => {
			await updatePermission('view-livechat-manager', ['admin']);

			await request.get(api('livechat/users/agent/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		}).timeout(5000);

		it('should return a valid user when all goes fine', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const agent = await createAgent();
			await request
				.get(api(`livechat/users/agent/${agent._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('user');
					expect(res.body.user).to.have.property('_id');
					expect(res.body.user).to.have.property('username');
					expect(res.body.user).to.not.have.property('roles');
				});
		});

		it('should return { user: null } when user is not an agent', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const user = await createUser();
			await request
				.get(api(`livechat/users/agent/${user._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('user');
					expect(res.body.user).to.be.null;
				});

			// cleanup
			await deleteUser(user);
		});
	});

	describe('DELETE livechat/users/:type/:_id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);

			await request.delete(api(`livechat/users/agent/id`)).set(credentials).expect('Content-Type', 'application/json').expect(403);
		}).timeout(5000);

		it('should return an error when type is invalid', async () => {
			await updatePermission('view-livechat-manager', ['admin']);

			await request.delete(api(`livechat/users/invalid-type/id`)).set(credentials).expect('Content-Type', 'application/json').expect(400);
		}).timeout(5000);

		it('should return an error when _id is invalid', async () => {
			await updatePermission('view-livechat-manager', ['admin']);

			await request.delete(api('livechat/users/agent/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		}).timeout(5000);

		it('should return a valid user when all goes fine', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const agent = await createAgent();
			await request
				.delete(api(`livechat/users/agent/${agent._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
		});
	});

	(IS_EE ? describe : describe.skip)('livechat/agents/:agentId/departments', () => {
		let dep1: ILivechatDepartment;
		let dep2: ILivechatDepartment;
		before(async () => {
			dep1 = await createDepartment(
				{
					enabled: true,
					name: Random.id(),
					showOnRegistration: true,
					email: `${Random.id()}@example.com`,
					showOnOfflineForm: true,
				},
				[{ agentId: credentials['X-User-Id'] }],
			);
			dep2 = await createDepartment(
				{
					enabled: false,
					name: Random.id(),
					email: `${Random.id()}@example.com`,
					showOnRegistration: true,
					showOnOfflineForm: true,
				},
				[{ agentId: credentials['X-User-Id'] }],
			);
		});

		after(async () => {
			await deleteDepartment(dep1._id);
			await deleteDepartment(dep2._id);
		});
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request
				.get(api(`livechat/agents/${agent._id}/departments`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			await updatePermission('view-l-room', ['livechat-manager', 'livechat-agent', 'admin']);
		});
		it('should return an empty array of departments when the agentId is invalid', async () => {
			await request
				.get(api('livechat/agents/invalid-id/departments'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('departments').and.to.be.an('array');
				});
		});
		it('should return an array of departments when the agentId is valid', async () => {
			await request
				.get(api(`livechat/agents/${agent._id}/departments`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('departments').and.to.be.an('array');
					expect(res.body.departments.length).to.be.equal(2);
					(res.body.departments as ILivechatDepartment[]).forEach((department) => {
						expect(department.agentId).to.be.equal(agent._id);
						expect(department).to.have.property('departmentName').that.is.a('string');
					});
				});
		});
		it('should return only enabled departments when param `enabledDepartmentsOnly` is true ', async () => {
			await request
				.get(api(`livechat/agents/${agent._id}/departments`))
				.set(credentials)
				.query({ enabledDepartmentsOnly: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('departments').and.to.be.an('array');
					expect(res.body.departments.length).to.be.equal(1);
					expect(res.body.departments[0].departmentEnabled).to.be.true;
				});
		});
	});

	describe('livechat/agent.info/:rid/:token', () => {
		it('should fail when token in url params is not valid', async () => {
			await request.get(api(`livechat/agent.info/soemthing/invalid-token`)).expect(400);
		});
		it('should fail when token is valid but rid isnt', async () => {
			const visitor = await createVisitor();
			await request.get(api(`livechat/agent.info/invalid-rid/${visitor.token}`)).expect(400);
		});
		/* it('should fail when room is not being served by any agent', async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request.get(api(`livechat/agent.info/${room._id}/${visitor.token}`)).expect(400);
		}); */
		it('should return a valid agent when the room is being served and the room belongs to visitor', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const inq = await fetchInquiry(room._id);
			await takeInquiry(inq._id, agent2.credentials);

			const { body } = await request.get(api(`livechat/agent.info/${room._id}/${visitor.token}`));
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('agent');
			expect(body.agent).to.have.property('_id', agent2.user._id);
		});
	});

	describe('livechat/agent.next/:token', () => {
		it('should fail when token in url params is not valid', async () => {
			await request.get(api(`livechat/agent.next/invalid-token`)).expect(400);
		});
		it('should return success when visitor with token has an open room', async () => {
			const visitor = await createVisitor();
			await createLivechatRoom(visitor.token);

			await request.get(api(`livechat/agent.next/${visitor.token}`)).expect(200);
		});
		it('should fail if theres no open room for visitor and algo is manual selection', async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			const visitor = await createVisitor();

			await request.get(api(`livechat/agent.next/${visitor.token}`)).expect(400);
		});
		// TODO: test cases when algo is Auto_Selection
	});

	describe('livechat/agent.status', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission to change its own status', async () => {
			await updatePermission('view-l-room', []);
			await request.post(api('livechat/agent.status')).set(credentials).send({ status: 'not-available' }).expect(403);

			await updatePermission('view-l-room', ['admin', 'livechat-agent', 'livechat-manager']);
		});
		it('should return an "unauthorized error" when the user does not have the necessary permission to change other status', async () => {
			await updatePermission('manage-livechat-agents', []);
			await request
				.post(api('livechat/agent.status'))
				.set(credentials)
				.send({ status: 'not-available', agentId: agent2.user._id })
				.expect(403);

			await updatePermission('manage-livechat-agents', ['admin']);
		});
		it('should return an error if user is not an agent', async () => {
			const user = await createUser({ roles: ['livechat-manager'] });
			const userCredentials = await login(user.username, password);
			await request
				.post(api('livechat/agent.status'))
				.set(userCredentials)
				.send({ status: 'available', agentId: user._id })
				.expect(404)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Agent not found');
				});

			// cleanup
			await deleteUser(user);
		});
		it('should return an error if status is not valid', async () => {
			await request
				.post(api('livechat/agent.status'))
				.set(agent2.credentials)
				.send({ status: 'invalid-status', agentId: agent2.user._id })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});
		it('should return an error if agentId param is not valid', async () => {
			await request
				.post(api('livechat/agent.status'))
				.set(agent2.credentials)
				.send({ status: 'available', agentId: 'invalid-agent-id' })
				.expect(404)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Agent not found');
				});
		});
		it('should change logged in users status', async () => {
			const currentUser: ILivechatAgent = await getMe(agent2.credentials);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(api('livechat/agent.status'))
				.set(agent2.credentials)
				.send({ status: newStatus, agentId: currentUser._id })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('status', newStatus);
				});
		});
		it('should allow managers to change other agents status', async () => {
			await updatePermission('manage-livechat-agents', ['admin']);

			const currentUser: ILivechatAgent = await getMe(agent2.credentials);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(api('livechat/agent.status'))
				.set(credentials)
				.send({ status: newStatus, agentId: currentUser._id })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('status', newStatus);
				});
		});
		it('should throw an error if agent tries to make themselves available outside of Business hour', async () => {
			await makeDefaultBusinessHourActiveAndClosed();

			const currentUser: ILivechatAgent = await getMe(agent2.credentials);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(api('livechat/agent.status'))
				.set(agent2.credentials)
				.send({ status: newStatus, agentId: currentUser._id })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-business-hours-are-closed');
				});
		});
		it('should not allow managers to make other agents available outside business hour', async () => {
			await updatePermission('manage-livechat-agents', ['admin']);

			const currentUser: ILivechatAgent = await getMe(agent2.credentials);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(api('livechat/agent.status'))
				.set(credentials)
				.send({ status: newStatus, agentId: currentUser._id })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('status', currentStatus);
				});

			await disableDefaultBusinessHour();
		});
	});

	describe('Agent sidebar', () => {
		let testUser: { user: IUser; credentials: Credentials };
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
		after(async () => {
			await deleteUser(testUser.user);
		});

		it('should return an empty list of rooms for a newly created agent', async () => {
			const { body } = await request.get(api('rooms.get')).set(testUser.credentials).send({}).expect(200);

			expect(body).to.have.property('success', true);
			expect(body.update.filter((r: IRoom) => r.t === 'l')).to.have.lengthOf(0);
		});

		it('should have a new room in his sidebar after taking a conversation from the queue', async () => {
			const { room } = await startANewLivechatRoomAndTakeIt({ agent: testUser.credentials });

			const { body } = await request.get(api('rooms.get')).set(testUser.credentials).send({}).expect(200);

			expect(body).to.have.property('success', true);
			const livechatRooms = body.update.filter((r: IRoom) => r.t === 'l');
			expect(livechatRooms).to.have.lengthOf(1);
			expect(body.update.find((r: { _id: string }) => r._id === room._id)).to.be.an('object');
			expect(body.update.find((r: { _id: string }) => r._id === 'GENERAL')).to.be.an('object');
		});

		it('should not have the room if user moves room back to queue', async () => {
			const { room } = await startANewLivechatRoomAndTakeIt({ agent: testUser.credentials });

			await moveBackToQueue(room._id, testUser.credentials);

			const { body } = await request
				.get(api('rooms.get'))
				.set(testUser.credentials)
				.query({ updatedSince: new Date(new Date().getTime() - 2000) })
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body.update.find((r: { _id: string }) => r._id === room._id)).to.be.undefined;
		});

		it('should not have the room if the user closes the room', async () => {
			const { room } = await startANewLivechatRoomAndTakeIt({ agent: testUser.credentials });

			await closeOmnichannelRoom(room._id);

			const { body } = await request.get(api('rooms.get')).set(testUser.credentials).expect(200);

			expect(body.update.find((r: { _id: string }) => r._id === room._id)).to.be.undefined;
		});
	});
});
