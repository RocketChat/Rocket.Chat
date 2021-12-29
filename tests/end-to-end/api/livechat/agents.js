import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { createAgent, createManager } from '../../../data/livechat/rooms.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - Agents', function () {
	this.retries(0);
	let agent;
	let manager;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
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

	describe('livechat/users/:type', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => updatePermission('transfer-livechat-guest', []))
				.then(() => {
					request
						.get(api('livechat/users/agent'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('error-not-authorized');
						})
						.end(done);
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
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('Invalid type');
						})
						.end(done);
				});
		});
		it('should return an array of agents', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => updatePermission('transfer-livechat-guest', ['admin']))
				.then(() => {
					request
						.get(api('livechat/users/agent'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.users).to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
							expect(res.body).to.have.property('count');
							const agentRecentlyCreated = res.body.users.find((user) => agent._id === user._id);
							expect(agentRecentlyCreated._id).to.be.equal(agent._id);
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
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.users).to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
							expect(res.body).to.have.property('count');
							const managerRecentlyCreated = res.body.users.find((user) => manager._id === user._id);
							expect(managerRecentlyCreated._id).to.be.equal(manager._id);
						})
						.end(done);
				});
		});
	});

	describe('livechat/agents/:agentId/departments', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api(`livechat/agents/${agent._id}/departments`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
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
					.expect((res) => {
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
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('departments').and.to.be.an('array');
						res.body.departments.forEach((department) => {
							expect(department.agentId).to.be.equal(agent._id);
						});
					})
					.end(done);
			});
		});
	});
});
