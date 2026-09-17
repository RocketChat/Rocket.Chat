import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';

describe('[Statistics]', () => {
	before((done) => getCredentials(done));

	after(() => updatePermission('view-statistics', ['admin']));

	describe('[/statistics]', () => {
		let lastUptime: unknown;
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-statistics', []);

			const res = await request.get(api('statistics')).set(credentials).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-not-allowed');
		});

		it('should return an object with the statistics', async () => {
			await updatePermission('view-statistics', ['admin']);

			const res = await request.get(api('statistics')).set(credentials).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('process');
			expect(res.body.process).to.have.property('uptime');

			lastUptime = res.body.process.uptime;
		});

		it('should update the statistics when is provided the "refresh:true" query parameter', async () => {
			const res = await request.get(api('statistics')).query({ refresh: 'true' }).set(credentials).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('process');
			expect(res.body.process).to.have.property('uptime');
			expect(lastUptime).to.not.be.equal(res.body.process.uptime);
		});
	});

	describe('[/statistics.list]', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-statistics', []);

			const res = await request.get(api('statistics.list')).set(credentials).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-not-allowed');
		});

		it('should return an array with the statistics', async () => {
			await updatePermission('view-statistics', ['admin']);

			const res = await request.get(api('statistics.list')).set(credentials).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('statistics').and.to.be.an('array');
			expect(res.body).to.have.property('offset');
			expect(res.body).to.have.property('total');
			expect(res.body).to.have.property('count');
		});

		it('should return an array with the statistics even requested with count and offset params', async () => {
			await updatePermission('view-statistics', ['admin']);

			const res = await request
				.get(api('statistics.list'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('statistics').and.to.be.an('array');
			expect(res.body).to.have.property('offset');
			expect(res.body).to.have.property('total');
			expect(res.body).to.have.property('count');
		});
	});
});
