import { randomBytes } from 'crypto';

import type { ILoginCode, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { api, request, getCredentials } from '../../data/api-data';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser } from '../../data/users.helper';
import { URL_MONGODB } from '../../e2e/config/constants';

const CODE_TTL_MS = 60 * 1000;

async function insertLoginCode(connection: MongoClient, userId: string): Promise<string> {
	const now = new Date();
	const code = randomBytes(32).toString('hex');

	await connection
		.db()
		.collection<ILoginCode>('rocketchat_login_codes')
		.insertOne({
			_id: code,
			userId,
			createdAt: now,
			expireAt: new Date(now.getTime() + CODE_TTL_MS),
		});

	return code;
}

describe('[Login Codes]', () => {
	let connection: MongoClient;

	before((done) => getCredentials(done));

	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);
	});

	after(async () => {
		await connection.close();
	});

	describe('POST [/loginCode.redeem]', () => {
		let testUser: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
		});

		after(async () => {
			await deleteUser(testUser);
		});

		it('should fail when code does not exist in the database', (done) => {
			void request
				.post(api('loginCode.redeem'))
				.send({ code: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should fail when code is an empty string', (done) => {
			void request
				.post(api('loginCode.redeem'))
				.send({ code: '' })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-code');
				})
				.end(done);
		});

		it('should return a loginToken and userId for a valid code', async () => {
			const code = await insertLoginCode(connection, testUser._id);

			await request
				.post(api('loginCode.redeem'))
				.send({ code })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('loginToken').that.is.a('string').and.is.not.empty;
					expect(res.body).to.have.property('userId', testUser._id);
				});
		});

		it('should invalidate a code after it has been redeemed', async () => {
			const code = await insertLoginCode(connection, testUser._id);

			await request.post(api('loginCode.redeem')).send({ code }).expect(200);

			await request
				.post(api('loginCode.redeem'))
				.send({ code })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-code');
				});
		});

		it('should return a loginToken that can be used for subsequent authenticated requests', async () => {
			const code = await insertLoginCode(connection, testUser._id);

			const redeemRes = await request.post(api('loginCode.redeem')).send({ code }).expect(200);

			const { loginToken, userId } = redeemRes.body;

			await request
				.get(api('me'))
				.set('X-Auth-Token', loginToken)
				.set('X-User-Id', userId)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('_id', testUser._id);
				});
		});
	});
});
