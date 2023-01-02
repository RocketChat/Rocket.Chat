/* eslint-env mocha */

import type { ILivechatAgent, ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { disableDefaultBusinessHour, makeDefaultBusinessHourActiveAndClosed } from '../../../data/livechat/businessHours';
import { createAgent, createManager, createVisitor, createLivechatRoom, takeInquiry, fetchInquiry } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, getMe, login } from '../../../data/users.helper';

describe('LIVECHAT - Agents', function () {
	this.retries(0);
	let agent: ILivechatAgent;
	let manager: ILivechatAgent;

	let agent2: { user: IUser; credentials: { 'X-Auth-Token': string; 'X-User-Id': string } };

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
			.then(() => updateSetting('Livechat_Routing_Method', 'Manual_Selection'))
			.then(createAgent)
			.then((createdAgent) => {
				agent = createdAgent;
			})
			.then(createManager)
			.then((createdManager) => {
				manager = createdManager;
				done();
			});
	});

	before(async () => {
		const user: IUser = await createUser();
		const userCredentials = await login(user.username, password);
		await createAgent(user.username);

		agent2 = {
			user,
			credentials: userCredentials,
		};
	});

	// TODO: missing test cases for POST method
	describe('GET livechat/users/:type', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('edit-omnichannel-contact', [])
				.then(() => updatePermission('transfer-livechat-guest', []))
				.then(() => updatePermission('manage-livechat-agents', []))
				.then(() => {
					request.get(api('livechat/users/agent')).set(credentials).expect('Content-Type', 'application/json').expect(403).end(done);
				});
		});
		it('should throw an error when the type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => updatePermission('manage-livechat-agents', ['admin']))
				.then(() => {
					request
						.get(api('livechat/users/invalid-type'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('Invalid type');
						})
						.end(done);
				});
		});
		it('should return an array of agents', (done) => {
			updatePermission('edit-omnichannel-contact', ['admin'])
				.then(() => updatePermission('transfer-livechat-guest', ['admin']))
				.then(() => updatePermission('manage-livechat-agents', ['admin']))
				.then(() => {
					request
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
						})
						.end(done);
				});
		});
		it('should return an array of managers', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => updatePermission('manage-livechat-agents', ['admin']))
				.then(() => {
					request
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
						})
						.end(done);
				});
		});
	});

	describe('POST livechat/users/:type', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', [])
				.then(() => {
					request
						.post(api('livechat/users/agent'))
						.set(credentials)
						.send({
							username: 'test-agent',
						})
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		});

		it('should return an error when type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request
						.post(api('livechat/users/invalid-type'))
						.set(credentials)
						.send({
							username: 'test-agent',
						})
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		});

		it('should return an error when username is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request
						.post(api('livechat/users/agent'))
						.set(credentials)
						.send({
							username: 'mr-not-valid',
						})
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		});

		it('should return a valid user when all goes fine', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createUser())
				.then((user) => {
					request
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
				})
				.then(() => done());
		});
	});

	describe('GET livechat/users/:type/:_id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', [])
				.then(() => {
					request
						.get(api(`livechat/users/agent/id${agent._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request
						.get(api(`livechat/users/invalid-type/invalid-id${agent._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when _id is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.get(api('livechat/users/agent/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return a valid user when all goes fine', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createAgent())
				.then((agent) => {
					request
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
				})
				.then(() => done());
		});

		it('should return { user: null } when user is not an agent', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createUser())
				.then((user) => {
					request
						.get(api(`livechat/users/agent/${user._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('user');
							expect(res.body.user).to.be.null;
						});
				})
				.then(() => done());
		});
	});

	describe('DELETE livechat/users/:type/:_id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', [])
				.then(() => {
					request.delete(api(`livechat/users/agent/id`)).set(credentials).expect('Content-Type', 'application/json').expect(403);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.delete(api(`livechat/users/invalid-type/id`)).set(credentials).expect('Content-Type', 'application/json').expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when _id is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.delete(api('livechat/users/agent/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return a valid user when all goes fine', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createAgent())
				.then((agent) => {
					request
						.delete(api(`livechat/users/agent/${agent._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200);
				})
				.then(() => done());
		});
	});

	describe('livechat/agents/:agentId/departments', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api(`livechat/agents/${agent._id}/departments`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an empty array of departments when the agentId is invalid', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api('livechat/agents/invalid-id/departments'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('departments').and.to.be.an('array');
					})
					.end(done);
			});
		});
		it('should return an array of departments when the agentId is valid', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api(`livechat/agents/${agent._id}/departments`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('departments').and.to.be.an('array');
						(res.body.departments as ILivechatDepartment[]).forEach((department) => {
							expect(department.agentId).to.be.equal(agent._id);
						});
					})
					.end(done);
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
			await takeInquiry(inq._id);

			const { body } = await request.get(api(`livechat/agent.info/${room._id}/${visitor.token}`));
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('agent');
			expect(body.agent).to.have.property('_id', 'rocketchat.internal.admin.test');
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
			const user: IUser = await createUser({ roles: ['livechat-manager'] });
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
			const currentUser: ILivechatAgent = await getMe(agent2.credentials as any);
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

			const currentUser: ILivechatAgent = await getMe(agent2.credentials as any);
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

			const currentUser: ILivechatAgent = await getMe(agent2.credentials as any);
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
		it('should allow managers to make other agents available outside business hour', async () => {
			await updatePermission('manage-livechat-agents', ['admin']);

			const currentUser: ILivechatAgent = await getMe(agent2.credentials as any);
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

			await disableDefaultBusinessHour();
		});
	});
});
