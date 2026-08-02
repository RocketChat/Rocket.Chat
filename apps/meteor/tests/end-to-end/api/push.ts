import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';

describe('[Push]', () => {
	before((done) => getCredentials(done));

	describe('POST [/push.token]', () => {
		it('should succeed with a valid gcm token', async () => {
			await request
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
				});
		});

		it('should succeed with a valid apn token', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'token',
					appName: 'com.example.rocketchat',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('result').and.to.be.an('object');
				});
		});

		it('should fail if not logged in', async () => {
			await request
				.post(api('push.token'))
				.send({
					type: 'gcm',
					value: 'token',
					appName: 'com.example.rocketchat',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});
	});

	describe('DELETE [/push.token]', () => {
		it('should fail if not logged in', async () => {
			await request
				.delete(api('push.token'))
				.send({
					token: 'token',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should fail if token is invalid', async () => {
			await request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: '123',
				})
				.expect(404)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should delete a token if valid', async () => {
			await request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: 'token',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail if token is already deleted', async () => {
			await request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: 'token',
				})
				.expect(404)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});
	});

	describe('[/push.test]', () => {
		before(() => updateSetting('Push_enable', false));

		it('should fail if not logged in', async () => {
			await request
				.post(api('push.test'))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should fail if push is disabled', async () => {
			await request
				.post(api('push.test'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-push-disabled');
				});
		});
	});

	describe('[/push.info]', () => {
		before(() => Promise.all([updateSetting('Push_gateway', 'https://random-gateway.rocket.chat')]));

		after(() => Promise.all([updateSetting('Push_gateway', 'https://gateway.rocket.chat')]));

		it('should fail if not logged in', async () => {
			await request
				.get(api('push.info'))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should succesfully retrieve non default push notification info', async () => {
			await request
				.get(api('push.info'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('pushGatewayEnabled', false);
					expect(res.body).to.have.property('defaultPushGateway', false);
				});
		});

		it('should succesfully retrieve default push notification info', async () => {
			await updateSetting('Push_gateway', 'https://gateway.rocket.chat');
			await request
				.get(api('push.info'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('pushGatewayEnabled', false);
					expect(res.body).to.have.property('defaultPushGateway', true);
				});
		});
	});
});
