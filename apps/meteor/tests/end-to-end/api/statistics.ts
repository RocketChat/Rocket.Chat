import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';

describe('[Statistics]', () => {
	before((done) => getCredentials(done));

	after(() => updatePermission('view-statistics', ['admin']));

	describe('[/statistics]', () => {
		let lastUptime: unknown;
		it('should return an error when the user does not have the necessary permission', (done) => {
			void updatePermission('view-statistics', []).then(() => {
				void request
					.get(api('statistics'))
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-allowed');
					})
					.end(done);
			});
		});
		it('should return an object with the statistics', (done) => {
			void updatePermission('view-statistics', ['admin']).then(() => {
				void request
					.get(api('statistics'))
					.set(credentials)
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('process');
						expect(res.body.process).to.have.property('uptime');
						lastUptime = res.body.process.uptime;
					})
					.end(done);
			});
		});
		it('should update the statistics when is provided the "refresh:true" query parameter', (done) => {
			void request
				.get(api('statistics'))
				.query({ refresh: 'true' })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('process');
					expect(res.body.process).to.have.property('uptime');
					expect(lastUptime).to.not.be.equal(res.body.process.uptime);
				})
				.end(done);
		});
	});

	describe('[/statistics.list]', () => {
		it('should return an error when the user does not have the necessary permission', (done) => {
			void updatePermission('view-statistics', []).then(() => {
				void request
					.get(api('statistics.list'))
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-allowed');
					})
					.end(done);
			});
		});
		it('should return an array with the statistics', (done) => {
			void updatePermission('view-statistics', ['admin']).then(() => {
				void request
					.get(api('statistics.list'))
					.set(credentials)
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('statistics').and.to.be.an('array');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('count');
					})
					.end(done);
			});
		});
		it('should return an array with the statistics even requested with count and offset params', (done) => {
			void updatePermission('view-statistics', ['admin']).then(() => {
				void request
					.get(api('statistics.list'))
					.set(credentials)
					.query({
						count: 5,
						offset: 0,
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('statistics').and.to.be.an('array');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('count');
					})
					.end(done);
			});
		});
	});
});
