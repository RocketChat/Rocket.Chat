import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { findWebdavAccountsByUserId } from '../../app/api/server/lib/webdav';

describe('[Webdav]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('/webdav.getMyAccounts', () => {
		it('should return my webdav accounts', (done) => {
			request
				.get(api('webdav.getMyAccounts'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('accounts').and.to.be.a('array');
				})
				.end(done);
		});
	});

	describe('/webdav.removeWebdavAccount', () => {
		const accountId = findWebdavAccountsByUserId({ uid: credentials['X-User-Id'] })[0].username;

		it('should return my webdav accounts', (done) => {
			request
				.post(api('webdav.removeWebdavAccount'))
				.set(credentials)
				.send({
					accountId,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('accounts').and.to.be.a('array');
				})
				.end(done);
		});
		it('should return an error when send an invalid request', (done) => {
			request
				.post(api('webdav.removeWebdavAccount'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
	});
});
