import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';

describe('banners', () => {
	before((done) => getCredentials(done));

	describe('[/banners.getNew]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.get(api('banners.getNew'))
				.query({
					platform: 'web',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if missing platform key', (done) => {
			void request
				.get(api('banners.getNew'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should fail if platform param is unknown', (done) => {
			void request
				.get(api('banners.getNew'))
				.set(credentials)
				.query({
					platform: 'unknownPlatform',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should fail if platform param is empty', (done) => {
			void request
				.get(api('banners.getNew'))
				.set(credentials)
				.query({
					platform: '',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return banners if platform param is valid', (done) => {
			void request
				.get(api('banners.getNew'))
				.set(credentials)
				.query({
					platform: 'web',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('[/banners.dismiss]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.post(api('banners.dismiss'))
				.send({
					bannerId: '123',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if missing bannerId key', (done) => {
			void request
				.post(api('banners.dismiss'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				})
				.end(done);
		});

		it('should fail if bannerId is empty', (done) => {
			void request
				.post(api('banners.dismiss'))
				.set(credentials)
				.send({
					bannerId: '',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should fail if bannerId is invalid', (done) => {
			void request
				.post(api('banners.dismiss'))
				.set(credentials)
				.send({
					bannerId: '123',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('[/banners]', () => {
		it('should fail if not logged in', async () => {
			return request
				.get(api('banners'))
				.query({
					platform: 'web',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should fail if missing platform', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail if platform is invalid', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({
					platform: 'invalid-platform',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should succesfully return web banners', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({
					platform: 'web',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});

		it('should succesfully return mobile banners', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({
					platform: 'mobile',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});
	});

	describe('[/banners/:id]', () => {
		it('should fail if not logged in', async () => {
			return request
				.get(api('banners/some-id'))
				.query({
					platform: 'web',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should fail if missing platform', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail if platform is invalid', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({
					platform: 'invalid-platform',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should succesfully return a web banner by id', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({
					platform: 'web',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});

		it('should succesfully return a mobile banner by id', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({
					platform: 'mobile',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});
	});
});
