import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';

async function createCustomUserStatus(name: string): Promise<string> {
	const res = await request.post(api('custom-user-status.create')).set(credentials).send({ name }).expect(200);
	return res.body.customUserStatus._id;
}

async function deleteCustomUserStatus(id: string): Promise<void> {
	await request.post(api('custom-user-status.delete')).set(credentials).send({ customUserStatusId: id }).expect(200);
}

describe('[CustomUserStatus]', () => {
	before((done) => {
		getCredentials(done);
	});

	describe('[/custom-user-status.list]', () => {
		let customUserStatusId: string;
		let customUserStatusName: string;

		before(async () => {
			customUserStatusName = `test-${Date.now()}`;
			customUserStatusId = await createCustomUserStatus(customUserStatusName);
		});

		after(async () => {
			await deleteCustomUserStatus(customUserStatusId);
		});

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

		it('should return one custom user status when requested with id param', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					_id: customUserStatusId,
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('total').and.to.equal(1);
					expect(res.body).to.have.property('offset').and.to.equal(0);
					expect(res.body).to.have.property('count').and.to.equal(1);
				})
				.end(done);
		});

		it('should return empty array when requested with an existing name param', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					name: customUserStatusName,
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('total').and.to.equal(1);
					expect(res.body).to.have.property('offset').and.to.equal(0);
					expect(res.body).to.have.property('count').and.to.equal(1);
				})
				.end(done);
		});

		it('should return empty array when requested with unknown name param', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					name: 'testxxx',
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array').and.to.have.lengthOf(0);
					expect(res.body).to.have.property('total').and.to.equal(0);
					expect(res.body).to.have.property('offset').and.to.equal(0);
					expect(res.body).to.have.property('count').and.to.equal(0);
				})
				.end(done);
		});
	});
});
