/* eslint-env mocha */
import { expect } from 'chai';
import type { ILivechatAgent, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { makeAgentAvailable, createAgent, createDepartment } from '../../../data/livechat/rooms';

describe('LIVECHAT - Departments', function () {
	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() =>
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createAgent())
				.then(() => makeAgentAvailable().then(() => done())),
		);
	});

	describe('GET livechat/department', () => {
		it('should return unauthorized error when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-departments', [])
				.then(() => updatePermission('view-l-room', []))
				.then(() => {
					request.get(api('livechat/department')).set(credentials).expect('Content-Type', 'application/json').expect(403).end(done);
				});
		});

		it('should return a list of departments', (done) => {
			updatePermission('view-livechat-departments', ['admin']).then(() => {
				request
					.get(api('livechat/department'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('departments');
						expect(res.body.departments).to.be.an('array');
						expect(res.body.departments).to.have.length.of.at.least(0);
					})
					.end(done);
			});
		});
	});

	describe('POST livechat/departments', () => {
		it('should return unauthorized error when the user does not have the necessary permission', (done) => {
			updatePermission('manage-livechat-departments', []).then(() => {
				request
					.post(api('livechat/department'))
					.set(credentials)
					.send({ department: { name: 'Test', enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' } })
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		}).timeout(5000);

		it('should return an error when no keys are provided', (done) => {
			updatePermission('manage-livechat-departments', ['admin']).then(() => {
				request
					.post(api('livechat/department'))
					.set(credentials)
					.send({ department: {} })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body).to.have.property('errorType', 'invalid-params');
					})
					.end(done);
			});
		}).timeout(5000);

		it('should create a new department', (done) => {
			updatePermission('manage-livechat-departments', ['admin']).then(() => {
				request
					.post(api('livechat/department'))
					.set(credentials)
					.send({ department: { name: 'Test', enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' } })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('department');
						expect(res.body.department).to.have.property('_id');
						expect(res.body.department).to.have.property('name', 'Test');
						expect(res.body.department).to.have.property('enabled', true);
						expect(res.body.department).to.have.property('showOnOfflineForm', true);
						expect(res.body.department).to.have.property('showOnRegistration', true);
					})
					.end(done);
			});
		});
	});

	describe('GET livechat/department/:_id', () => {
		it('should return unauthorized error when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-departments', []).then(() => {
				request
					.get(api('livechat/department/testetetetstetete'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		}).timeout(5000);

		it('should return an error when the department does not exist', (done) => {
			updatePermission('view-livechat-departments', ['admin']).then(() => {
				request
					.get(api('livechat/department/testesteteste'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('department');
						expect(res.body.department).to.be.null;
					})
					.end(done);
			});
		}).timeout(5000);

		it('should return the department', (done) => {
			let dep: ILivechatDepartment;
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => createDepartment())
				.then((department: ILivechatDepartment) => {
					dep = department;
				})
				.then(() => {
					request
						.get(api(`livechat/department/${dep._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('department');
							expect(res.body.department).to.have.property('_id');
							expect(res.body.department).to.have.property('name', dep.name);
							expect(res.body.department).to.have.property('enabled', dep.enabled);
							expect(res.body.department).to.have.property('showOnOfflineForm', dep.showOnOfflineForm);
							expect(res.body.department).to.have.property('showOnRegistration', dep.showOnRegistration);
							expect(res.body.department).to.have.property('email', dep.email);
						})
						.end(done);
				});
		});
	});

	describe('GET livechat/department.autocomplete', () => {
		it('should return an error when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-departments', [])
				.then(() => updatePermission('view-l-room', []))
				.then(() => {
					request
						.get(api('livechat/department.autocomplete'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.end(done);
				});
		});
		it('should return an error when the query is not provided', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department.autocomplete'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
		});

		it('should return an error when the query is empty', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department.autocomplete'))
						.set(credentials)
						.query({ selector: '' })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
		});

		it('should return an error when the query is not a string', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department.autocomplete'))
						.set(credentials)
						.query({ selector: { name: 'test' } })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
		});

		it('should return an error when selector is not valid JSON', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department.autocomplete'))
						.set(credentials)
						.query({ selector: '{name: "test"' })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
		});

		it('should return a list of departments that match selector.term', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department.autocomplete'))
						.set(credentials)
						.query({ selector: '{"term":"test"}' })
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('items');
							expect(res.body.items).to.be.an('array');
							expect(res.body.items).to.have.length.of.at.least(1);
							expect(res.body.items[0]).to.have.property('_id');
							expect(res.body.items[0]).to.have.property('name');
						})
						.end(done);
				});
		});

		it('should return a list of departments excluding the ids on selector.exceptions', (done) => {
			let dep: ILivechatDepartment;

			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => createDepartment())
				.then((department: ILivechatDepartment) => {
					dep = department;
				})
				.then(() => {
					request
						.get(api('livechat/department.autocomplete'))
						.set(credentials)
						.query({ selector: `{"exceptions":["${dep._id}"]}` })
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('items');
							expect(res.body.items).to.be.an('array');
							expect(res.body.items).to.have.length.of.at.least(1);
							expect(res.body.items[0]).to.have.property('_id');
							expect(res.body.items[0]).to.have.property('name');
							expect(res.body.items.every((department: ILivechatDepartment) => department._id !== dep._id)).to.be.true;
						})
						.end(done);
				});
		});
	});

	describe('GET livechat/departments.listByIds', () => {
		it('should throw an error if the user doesnt have the permission to view the departments', (done) => {
			updatePermission('view-livechat-departments', [])
				.then(() => updatePermission('view-l-room', []))
				.then(() => {
					request
						.get(api('livechat/department.listByIds'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.end(done);
				});
		});

		it('should return an error when the query is not present', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department.listByIds'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
		});

		it('should return an error when the query is not an array', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department.listByIds'))
						.set(credentials)
						.query({ ids: 'test' })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
		});
	});

	describe('GET livechat/department/:departmentId/agents', () => {
		it('should throw an error if the user doesnt have the permission to view the departments', (done) => {
			updatePermission('view-livechat-departments', [])
				.then(() => updatePermission('view-l-room', []))
				.then(() => {
					request
						.get(api('livechat/department/test/agents'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.end(done);
				});
		});

		it('should return an empty array when the departmentId is not valid', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin', 'livechat-agent']))
				.then(() => {
					request
						.get(api('livechat/department/test/agents'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('agents');
							expect(res.body.agents).to.be.an('array');
							expect(res.body.agents).to.have.lengthOf(0);
							expect(res.body.total).to.be.equal(0);
						})
						.end(done);
				});
		});

		it('should return an emtpy array for a department without agents', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin', 'livechat-agent']))
				.then(() => createDepartment())
				.then((dep: ILivechatDepartment) => {
					request
						.get(api(`livechat/department/${dep._id}/agents`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('agents');
							expect(res.body.agents).to.be.an('array');
							expect(res.body.agents).to.have.lengthOf(0);
							expect(res.body.total).to.be.equal(0);
						})
						.end(done);
				});
		});

		it('should return the agents of the department', (done) => {
			updatePermission('view-livechat-departments', ['admin'])
				.then(() => updatePermission('view-l-room', ['admin', 'livechat-agent']))
				.then(() => createAgent())
				.then((agent: ILivechatAgent) => createDepartment([{ agentId: agent._id }]))
				.then((dep: ILivechatDepartment) => {
					request
						.get(api(`livechat/department/${dep._id}/agents`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('agents');
							expect(res.body.agents).to.be.an('array');
							expect(res.body.agents).to.have.lengthOf(1);
							expect(res.body.agents[0]).to.have.property('_id');
							expect(res.body.agents[0]).to.have.property('departmentId', dep._id);
							expect(res.body.agents[0]).to.have.property('departmentEnabled', true);
							expect(res.body.count).to.be.equal(1);
						})
						.end(done);
				});
		});
	});

	describe('POST livechat/department/:departmentId/agents', () => {
		it('should throw an error if the user doesnt have the permission to manage the departments', (done) => {
			updatePermission('manage-livechat-departments', [])
				.then(() => updatePermission('add-livechat-department-agents', []))
				.then(() => {
					request
						.post(api('livechat/department/test/agents'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.end(done);
				});
		});

		it('should throw an error if the departmentId is not valid', (done) => {
			updatePermission('manage-livechat-departments', ['admin'])
				.then(() => updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']))
				.then(() => {
					request
						.post(api('livechat/department/test/agents'))
						.set(credentials)
						.send({ upsert: [], remove: [] })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', 'Department not found [error-department-not-found]');
						})
						.end(done);
				});
		});

		it('should throw an error if body doesnt contain { upsert: [], remove: [] }', (done) => {
			updatePermission('manage-livechat-departments', ['admin'])
				.then(() => updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']))
				.then(() => createDepartment())
				.then((dep: ILivechatDepartment) => {
					request
						.post(api(`livechat/department/${dep._id}/agents`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', "Match error: Missing key 'upsert'");
						})
						.end(done);
				});
		});

		it('should throw an error if upsert or remove in body doesnt contain agentId and username', (done) => {
			updatePermission('manage-livechat-departments', ['admin'])
				.then(() => updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']))
				.then(() => createDepartment())
				.then((dep: ILivechatDepartment) => {
					request
						.post(api(`livechat/department/${dep._id}/agents`))
						.set(credentials)
						.send({ upsert: [{}], remove: [] })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', "Match error: Missing key 'agentId' in field upsert[0]");
						})
						.end(done);
				});
		});

		it('should sucessfully add an agent to a department', (done) => {
			updatePermission('manage-livechat-departments', ['admin'])
				.then(() => updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']))
				.then(() => Promise.all([createDepartment(), createAgent()]))
				.then(([dep, agent]: [ILivechatDepartment, ILivechatAgent]) => {
					request
						.post(api(`livechat/department/${dep._id}/agents`))
						.set(credentials)
						.send({ upsert: [{ agentId: agent._id, username: agent.username }], remove: [] })
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
		});
	});
});
