import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createDepartment } from '../../../data/livechat/department.js';

describe('LIVECHAT - departments', function () {
	this.retries(0);
	let department;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
			.then(() => createDepartment())
			.then((createdDepartment) => {
				department = createdDepartment;
				done();
			})
			.catch(console.log);
	});

	describe('livechat/department', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission ["view-livechat-departments", "view-l-room"]', (done) => {
			updatePermission('view-l-room', [])
				.then(() => updatePermission('view-livechat-departments', []))
				.then(() => {
					request
						.get(api('livechat/department'))
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
		it('should return an array of departments', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => updatePermission('view-livechat-departments', ['admin']))
				.then(() => {
					request
						.get(api('livechat/department'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.departments).to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
							expect(res.body).to.have.property('count');
						})
						.end(done);
				});
		});
	});

	describe('livechat/department/id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission ["view-livechat-departments", "view-l-room"]', (done) => {
			updatePermission('view-l-room', [])
				.then(() => updatePermission('view-livechat-departments', []))
				.then(() => {
					request
						.get(api(`livechat/department/${department._id}`))
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
		it('should return the created department without the agents if the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => updatePermission('view-livechat-departments', []))
				.then(() => {
					request
						.get(api(`livechat/department/${department._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('department');
							expect(res.body).to.not.have.property('agents');
							expect(res.body.department._id).to.be.equal(department._id);
						})
						.end(done);
				});
		});
		it('should return the created department without the agents if the user does have the permission but request to no include the agents', (done) => {
			updatePermission('view-livechat-departments', ['admin']).then(() => {
				request
					.get(api(`livechat/department/${department._id}?includeAgents=false`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('department');
						expect(res.body).to.not.have.property('agents');
						expect(res.body.department._id).to.be.equal(department._id);
					})
					.end(done);
			});
		});
		it('should return the created department', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => updatePermission('view-livechat-departments', ['admin']))
				.then(() => {
					request
						.get(api(`livechat/department/${department._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('department');
							expect(res.body).to.have.property('agents');
							expect(res.body.department._id).to.be.equal(department._id);
						})
						.end(done);
				});
		});
	});
});
