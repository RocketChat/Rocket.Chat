import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';

describe('[Webdav]', () => {
	before((done) => getCredentials(done));

	describe('/webdav.getMyAccounts', () => {
		it('should return my webdav accounts', async () => {
			const res = await request.get(api('webdav.getMyAccounts')).set(credentials).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('accounts').and.to.be.a('array');
		});
	});

	describe('/webdav.removeWebdavAccount', () => {
		it('should return an error when send an invalid request', async () => {
			const res = await request.post(api('webdav.removeWebdavAccount')).set(credentials).send({}).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
		});

		it('should return an error when using an invalid account id', async () => {
			const res = await request
				.post(api('webdav.removeWebdavAccount'))
				.set(credentials)
				.send({
					accountId: {},
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
		});
	});
});
