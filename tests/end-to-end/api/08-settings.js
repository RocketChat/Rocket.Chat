import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Settings]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/settings.public]', () => {
		it('should return public settings', (done) => {
			request
				.get(api('settings.public'))
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('settings');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('[/settings]', () => {
		it('should return private settings', (done) => {
			request
				.get(api('settings'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('settings');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('[/settings/:_id]', () => {
		it('should return one setting', (done) => {
			request
				.get(api('settings/Site_Url'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('_id', 'Site_Url');
					expect(res.body).to.have.property('value');
				})
				.end(done);
		});
	});

	describe('[/service.configurations]', () => {
		it('should return service configurations', (done) => {
			request
				.get(api('service.configurations'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('configurations');
				})
				.end(done);
		});
	});

	describe('/settings.oauth', () => {
		it('should have return list of available oauth services when user is not logged', (done) => {
			request
				.get(api('settings.oauth'))
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('services').and.to.be.an('array');
				})
				.end(done);
		});

		it('should have return list of available oauth services when user is logged', (done) => {
			request
				.get(api('settings.oauth'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('services').and.to.be.an('array');
				})
				.end(done);
		});
	});
});
