import type { IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';
import speakeasy from 'speakeasy';

import { getCredentials, methodCall, request } from '../../../data/api-data';
import { password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';

describe('2fa:enable', function () {
	this.retries(0);
	let totpSecret: string;
	let user1: IUser;
	let user2: IUser;
	let user3: IUser;
	let user1Credentials: { 'X-Auth-Token': string; 'X-User-Id': string };
	let user2Credentials: { 'X-Auth-Token': string; 'X-User-Id': string };
	let user3Credentials: { 'X-Auth-Token': string; 'X-User-Id': string };

	before((done) => getCredentials(done));

	before('create user', async () => {
		[user1, user2, user3] = await Promise.all([
			createUser({ username: Random.id(), email: `${Random.id()}@example.com`, verified: true }),
			createUser({ username: Random.id(), email: `${Random.id()}@example.com}`, verified: true }),
			createUser({ username: Random.id(), email: `${Random.id()}@example.com}`, verified: false }),
		]);
		[user1Credentials, user2Credentials, user3Credentials] = await Promise.all([
			login(user1.username, password),
			login(user2.username, password),
			login(user3.username, password),
		]);
	});

	after('remove user', async () => Promise.all([deleteUser(user1), deleteUser(user2), deleteUser(user3)]));

	it('should return error when user is not logged in', async () => {
		await request
			.post(methodCall('2fa:enable'))
			.send({
				message: JSON.stringify({
					msg: 'method',
					id: 'id1',
					method: '2fa:enable',
					params: [],
				}),
			})
			.expect(401)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'error');
			});
	});

	it('should return error when user is not verified', async () => {
		await request
			.post(methodCall('2fa:enable'))
			.set(user3Credentials)
			.send({
				message: JSON.stringify({
					msg: 'method',
					id: 'id1',
					method: '2fa:enable',
					params: [],
				}),
			})
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('message');
				const result = JSON.parse(res.body.message);
				expect(result).to.have.property('error');
				expect(result.error).to.not.have.property('errpr', 'error-invalid-user');
			});
	});

	it('should return secret and qr code url when 2fa is disabled on user', async () => {
		await request
			.post(methodCall('2fa:enable'))
			.set(user1Credentials)
			.send({
				message: JSON.stringify({
					msg: 'method',
					id: 'id1',
					method: '2fa:enable',
					params: [],
				}),
			})
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				const parsedBody = JSON.parse(res.body.message);
				expect(parsedBody).to.have.property('result');
				expect(parsedBody.result).to.have.property('secret').of.a('string');
				expect(parsedBody.result)
					.to.have.property('url')
					.of.a('string')
					.match(/^otpauth:\/\//);
			});
	});

	it('should enable 2fa on the user', async () => {
		const enableResponse = await request
			.post(methodCall('2fa:enable'))
			.set(user2Credentials)
			.send({
				message: JSON.stringify({
					msg: 'method',
					id: 'id2',
					method: '2fa:enable',
					params: [],
				}),
			})
			.expect(200);

		const enableData = JSON.parse(enableResponse.body.message);
		totpSecret = enableData.result.secret;

		await request
			.post(methodCall('2fa:validateTempToken'))
			.set(user2Credentials)
			.send({
				message: JSON.stringify({
					msg: 'method',
					id: 'id3',
					method: '2fa:validateTempToken',
					params: [speakeasy.totp({ secret: totpSecret, encoding: 'base32' })],
				}),
			})
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				const parsedBody = JSON.parse(res.body.message);
				expect(parsedBody).to.have.property('result');
				expect(parsedBody.result).to.have.property('codes').of.a('array');
			});
	});

	it('should return error when 2fa is already enabled on the user', async () => {
		await request
			.post(methodCall('2fa:enable'))
			.set(user2Credentials)
			.send({
				message: JSON.stringify({
					msg: 'method',
					id: 'id4',
					method: '2fa:enable',
					params: [],
				}),
			})
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				const parsedBody = JSON.parse(res.body.message);
				expect(parsedBody).to.have.property('error');
				expect(parsedBody).to.not.have.property('result');
			});
	});
});
