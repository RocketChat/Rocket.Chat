import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';

describe('[CustomUserStatus]', () => {
	before((done) => getCredentials(done));

	describe('[/custom-user-status.list]', () => {
		it('should return custom user status', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return custom user status even requested with count and offset params', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					count: 5,
					offset: 0,
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('[/custom-user-status.create]', () => {
		let customUserStatusId;

		after(async () => {
			return request
				.post(api('custom-user-status.delete'))
				.set(credentials)
				.send({
					customUserStatusId,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail creating a custom user status if no name is provided', async () => {
			return request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({
					statusType: 'online',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail creating a custom user status if an invalid status type is provided', async () => {
			return request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({
					name: 'custom-status',
					statusType: 'invalid-type',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should succesfully create a custom user status', async () => {
			const statusName = 'custom-status';
			const statusType = 'online';
			return request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({
					name: statusName,
					statusType,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('customUserStatus').that.is.an('object');
					expect(res.body.customUserStatus).to.have.property('_id');
					expect(res.body.customUserStatus).to.have.property('name', statusName);
					expect(res.body.customUserStatus).to.have.property('statusType', statusType);
					expect(res.body.customUserStatus).to.have.property('_updatedAt');
					customUserStatusId = res.body.customUserStatus._id;
				});
		});
	});

	describe('[/custom-user-status.update]', () => {
		let customUserStatusId;
		const customUserStatusName = 'custom-status';

		before(async () => {
			return request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({
					name: customUserStatusName,
					statusType: 'online',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('customUserStatus').that.is.an('object');
					expect(res.body.customUserStatus).to.have.property('_id');
					expect(res.body.customUserStatus).to.have.property('name', customUserStatusName);
					expect(res.body.customUserStatus).to.have.property('statusType', 'online');
					expect(res.body.customUserStatus).to.have.property('_updatedAt');
					customUserStatusId = res.body.customUserStatus._id;
				});
		});

		after(async () => {
			return request
				.post(api('custom-user-status.delete'))
				.set(credentials)
				.send({
					customUserStatusId,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail updating a custom user status if no name is provided', async () => {
			return request
				.post(api('custom-user-status.update'))
				.set(credentials)
				.send({
					_id: customUserStatusId,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail updating a custom user status if no id is provided', async () => {
			return request
				.post(api('custom-user-status.update'))
				.set(credentials)
				.send({
					name: customUserStatusName,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail updating a custom user status if an invalid status type is provided', async () => {
			return request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({
					_id: customUserStatusId,
					name: customUserStatusName,
					statusType: 'invalid-type',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should succesfully update a custom user status', async () => {
			const statusName = 'custom-status-updated';
			const statusType = 'offline';
			return request
				.post(api('custom-user-status.update'))
				.set(credentials)
				.send({
					_id: customUserStatusId,
					name: statusName,
					statusType,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('customUserStatus').that.is.an('object');
					expect(res.body.customUserStatus).to.have.property('_id', customUserStatusId);
					expect(res.body.customUserStatus).to.have.property('name', statusName);
					expect(res.body.customUserStatus).to.have.property('statusType', statusType);
					expect(res.body.customUserStatus).to.have.property('_updatedAt');
				});
		});
	});
});
