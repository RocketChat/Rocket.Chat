import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('push token', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('POST [/push.token]', () => {
		it('should fail if not logged in', (done) => {
			request
				.post(api('push.token'))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if missing type', (done) => {
			request
				.post(api('push.token'))
				.set(credentials)
				.send({
					value: 'token',
					appName: 'com.example.rocketchat',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-type-param-not-valid');
				})
				.end(done);
		});

		it('should fail if missing value', (done) => {
			request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'gcm',
					appName: 'com.example.rocketchat',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-token-param-not-valid');
				})
				.end(done);
		});

		it('should fail if missing appName', (done) => {
			request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'gcm',
					value: 'token',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-appName-param-not-valid');
				})
				.end(done);
		});

		it('should fail if type param is unknown', (done) => {
			request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'unknownPlatform',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-type-param-not-valid');
				})
				.end(done);
		});

		it('should fail if token param is empty', (done) => {
			request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'gcm',
					appName: 'com.example.rocketchat',
					value: '',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-token-param-not-valid');
				})
				.end(done);
		});

		it('should add a token if valid', (done) => {
			request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'gcm',
					value: 'token',
					appName: 'com.example.rocketchat',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('result').and.to.be.an('object');
				})
				.end(done);
		});
	});

	describe('DELETE [/push.token]', () => {
		it('should fail if not logged in', (done) => {
			request
				.delete(api('push.token'))
				.send({
					token: 'token',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if missing token key', (done) => {
			request
				.delete(api('push.token'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-token-param-not-valid');
				})
				.end(done);
		});

		it('should fail if token is empty', (done) => {
			request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: '',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-token-param-not-valid');
				})
				.end(done);
		});

		it('should fail if token is invalid', (done) => {
			request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: '123',
				})
				.expect(404)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should delete a token if valid', (done) => {
			request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: 'token',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should fail if token is already deleted', (done) => {
			request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: 'token',
				})
				.expect(404)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});
});
