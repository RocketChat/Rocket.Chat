import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('banners', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/banners.getNew]', () => {
		it('should fail if not logged in', (done) => {
			request
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
			request
				.get(api('banners.getNew'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should fail if platform param is unknown', (done) => {
			request
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
			request
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
			request
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
			request
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
			request
				.post(api('banners.dismiss'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', "Match error: Missing key 'bannerId'");
				})
				.end(done);
		});

		it('should fail if missing bannerId is empty', (done) => {
			request
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

		it('should fail if missing bannerId is invalid', (done) => {
			request
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
});
