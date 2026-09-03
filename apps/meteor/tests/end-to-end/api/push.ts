import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

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
					expect(res.body.result).to.include({ tokenValue: 'token', tokenType: 'gcm' });
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
					expect(res.body.result).to.include({ tokenValue: 'token', tokenType: 'apn' });
				});
		});

		it('should not create a voip token document when the device token is gcm', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'gcm',
					value: 'gcm-device-token',
					appName: 'com.example.rocketchat',
					voipToken: 'voip-token-rejected-for-gcm',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body.result).to.include({ tokenValue: 'gcm-device-token', tokenType: 'gcm' });
				});

			await request.delete(api('push.token')).set(credentials).send({ token: 'voip-token-rejected-for-gcm' }).expect(404);
		});

		it('should create a voip token document when the device token is apn', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'apn-device-token',
					appName: 'com.example.rocketchat',
					voipToken: 'voip-token-kept-for-apn',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body.result).to.include({ tokenValue: 'apn-device-token', tokenType: 'apn' });
				});

			await request.delete(api('push.token')).set(credentials).send({ token: 'voip-token-kept-for-apn' }).expect(200);
		});

		it('should drop a previously registered voip token when the device re-registers without one', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'apn-device-token',
					appName: 'com.example.rocketchat',
					voipToken: 'voip-token-to-be-dropped',
				})
				.expect(200);

			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'apn-device-token',
					appName: 'com.example.rocketchat',
				})
				.expect(200);

			await request.delete(api('push.token')).set(credentials).send({ token: 'voip-token-to-be-dropped' }).expect(404);
		});

		it('should not echo the voip token back in the response', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'apn-echo-check',
					appName: 'com.example.rocketchat',
					voipToken: 'voip-echo-check',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body.result).to.not.have.property('voipToken');
					expect(res.body.result).to.not.have.property('token');
				});
		});

		it('should keep the device token when re-registering without a voip token', async () => {
			const send = (extra: Record<string, string> = {}) =>
				request
					.post(api('push.token'))
					.set(credentials)
					.send({ type: 'apn', value: 'apn-kept', appName: 'com.example.rocketchat', ...extra })
					.expect(200);

			await send({ voipToken: 'voip-dropped-on-rereg' });
			await send();

			await request.delete(api('push.token')).set(credentials).send({ token: 'voip-dropped-on-rereg' }).expect(404);
			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-kept' }).expect(200);
		});

		it('should not duplicate documents when the same device registers twice', async () => {
			const send = () =>
				request
					.post(api('push.token'))
					.set(credentials)
					.send({ type: 'apn', value: 'apn-twice', appName: 'com.example.rocketchat' })
					.expect(200);

			await send();
			await send();

			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-twice' }).expect(200);
			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-twice' }).expect(404);
		});

		it('should retire the previous device token when the token rotates', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({ type: 'apn', value: 'apn-before-rotation', appName: 'com.example.rocketchat', voipToken: 'voip-across-rotation' })
				.expect(200);

			await request
				.post(api('push.token'))
				.set(credentials)
				.send({ type: 'apn', value: 'apn-after-rotation', appName: 'com.example.rocketchat', voipToken: 'voip-across-rotation' })
				.expect(200);

			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-before-rotation' }).expect(404);
			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-after-rotation' }).expect(200);
		});

		it('should hand the device over when another user registers the same token', async () => {
			const other = await createUser();
			const otherCredentials = await login(other.username, password);

			await request
				.post(api('push.token'))
				.set(credentials)
				.send({ type: 'apn', value: 'apn-handed-over', appName: 'com.example.rocketchat' })
				.expect(200);

			await request
				.post(api('push.token'))
				.set(otherCredentials)
				.send({ type: 'apn', value: 'apn-handed-over', appName: 'com.example.rocketchat' })
				.expect(200);

			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-handed-over' }).expect(404);
			await request.delete(api('push.token')).set(otherCredentials).send({ token: 'apn-handed-over' }).expect(200);

			await deleteUser(other);
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

		it('should fail if missing type', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					value: 'token',
					appName: 'com.example.rocketchat',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').that.includes(`must have required property 'type'`);
				});
		});

		it('should fail if missing value', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'gcm',
					appName: 'com.example.rocketchat',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').that.includes(`must have required property 'value'`);
				});
		});

		it('should fail if missing appName', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'gcm',
					value: 'token',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').that.includes(`must have required property 'appName'`);
				});
		});

		it('should fail if type param is unknown', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'unknownPlatform',
					value: 'token',
					appName: 'com.example.rocketchat',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').that.includes(`must be equal to one of the allowed values`);
				});
		});

		it('should fail if token param is empty', async () => {
			await request
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
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').that.includes(`must NOT have fewer than 1 characters`);
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

		it('should fail if missing token key', async () => {
			await request
				.delete(api('push.token'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').that.includes(`must have required property 'token'`);
				});
		});

		it('should fail if token is empty', async () => {
			await request
				.delete(api('push.token'))
				.set(credentials)
				.send({
					token: '',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error').that.includes(`must NOT have fewer than 1 characters`);
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
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'token',
					appName: 'com.example.rocketchat',
				})
				.expect(200);

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

		it('should remove the voip sibling when the device token is deleted', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'apn-device-retired',
					appName: 'com.example.rocketchat',
					voipToken: 'voip-sibling-retired',
				})
				.expect(200);

			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-device-retired' }).expect(200);

			await request.delete(api('push.token')).set(credentials).send({ token: 'voip-sibling-retired' }).expect(404);
		});

		it('should keep the device token when only the voip token is deleted', async () => {
			await request
				.post(api('push.token'))
				.set(credentials)
				.send({
					type: 'apn',
					value: 'apn-device-kept',
					appName: 'com.example.rocketchat',
					voipToken: 'voip-only-deleted',
				})
				.expect(200);

			await request.delete(api('push.token')).set(credentials).send({ token: 'voip-only-deleted' }).expect(200);

			await request.delete(api('push.token')).set(credentials).send({ token: 'apn-device-kept' }).expect(200);
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

	describe('Session lifecycle [/push.token]', () => {
		it('should drop every token of a session when it logs out', async () => {
			const user = await createUser();
			const session = await login(user.username, password);

			await request
				.post(api('push.token'))
				.set(session)
				.send({ type: 'apn', value: 'apn-session-scoped', appName: 'com.example.rocketchat', voipToken: 'voip-session-scoped' })
				.expect(200);

			await request.post(api('logout')).set(session).expect(200);

			const revived = await login(user.username, password);

			await request.delete(api('push.token')).set(revived).send({ token: 'apn-session-scoped' }).expect(404);
			await request.delete(api('push.token')).set(revived).send({ token: 'voip-session-scoped' }).expect(404);

			await deleteUser(user);
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
