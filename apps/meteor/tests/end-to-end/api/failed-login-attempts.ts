import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, beforeEach, afterEach, describe, it } from 'mocha';

import { sleep } from '../../../lib/utils/sleep';
import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updateSetting, updatePermission } from '../../data/permissions.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser } from '../../data/users.helper';

describe('[Failed Login Attempts]', () => {
	const maxAttemptsByUser = 2;
	const maxAttemptsByIp = 4;
	const userBlockSeconds = 3;
	const ipBlockSeconds = 8;

	before((done) => getCredentials(done));

	before(() =>
		Promise.all([
			updateSetting('Block_Multiple_Failed_Logins_Enabled', true),
			updateSetting('Block_Multiple_Failed_Logins_By_Ip', true),
			updateSetting('Block_Multiple_Failed_Logins_By_User', true),
			updateSetting('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', maxAttemptsByUser),
			updateSetting('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes', userBlockSeconds / 60),
			updateSetting('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', maxAttemptsByIp),
			updateSetting('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', ipBlockSeconds / 60),
			updatePermission('logout-other-user', ['admin']),
		]),
	);

	after(() =>
		Promise.all([
			updateSetting('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', 10),
			updateSetting('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes', 5),
			updateSetting('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 50),
			updateSetting('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', 5),
			updateSetting('Block_Multiple_Failed_Logins_Enabled', true),
			updateSetting('Block_Multiple_Failed_Logins_By_Ip', true),
			updateSetting('Block_Multiple_Failed_Logins_By_User', true),
			updatePermission('logout-other-user', ['admin']),
		]),
	);

	async function shouldFailLoginWithUser(username: string, password: string) {
		await request
			.post(api('login'))
			.send({
				user: username,
				password,
			})
			.expect('Content-Type', 'application/json')
			.expect(401)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'error');
				expect(res.body).to.have.property('message', 'Unauthorized');
			});
	}

	async function shouldSuccesfullyLoginWithUser(username: string, password: string) {
		await request
			.post(api('login'))
			.send({
				user: username,
				password,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'success');
				expect(res.body).to.have.property('data').and.to.be.an('object');
				expect(res.body.data).to.have.property('userId');
				expect(res.body.data).to.have.property('authToken');
			});
	}

	async function shouldLogoutUser(uid: string) {
		await request.post(api('users.logout')).set(credentials).send({ userId: uid }).expect('Content-Type', 'application/json').expect(200);
	}

	async function shouldBlockLogin(username: string, password: string, reason: 'user' | 'ip') {
		await request
			.post(api('login'))
			.send({
				user: username,
				password,
			})
			.expect('Content-Type', 'application/json')
			.expect(401)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'error');
				expect(res.body).to.have.property('error', `error-login-blocked-for-${reason}`);
			});
	}

	async function failMaxAttempts(username: string, password: string) {
		const promises = [];
		for (let i = 0; i < maxAttemptsByUser; i++) {
			promises.push(shouldFailLoginWithUser(username, password));
		}
		await Promise.all(promises);
	}

	describe('[Block by User]', () => {
		let user: TestUser<IUser>;

		before(async () => {
			await updateSetting('Block_Multiple_Failed_Logins_By_Ip', false);
		});

		after(async () => {
			await updateSetting('Block_Multiple_Failed_Logins_By_Ip', true);
		});

		beforeEach(async () => {
			user = await createUser();
		});

		afterEach(async () => {
			await deleteUser(user);
		});

		it('should block by User when the limit amount of failed attempts is reached', async () => {
			await failMaxAttempts(user.username, `${password}-incorrect`);

			await shouldBlockLogin(user.username, password, 'user');
		});

		it('should unblock user after block time', async () => {
			await failMaxAttempts(user.username, `${password}-incorrect`);

			await shouldBlockLogin(user.username, password, 'user');
			await sleep(userBlockSeconds * 1000);
			await shouldSuccesfullyLoginWithUser(user.username, password);
		});

		it('should reset counter of failed attempts after a successful login', async () => {
			await failMaxAttempts(user.username, `${password}-incorrect`);

			await shouldBlockLogin(user.username, password, 'user');
			await sleep(userBlockSeconds * 1000);

			await shouldFailLoginWithUser(user.username, `${password}-incorrect`);
			await shouldSuccesfullyLoginWithUser(user.username, password);
			await shouldLogoutUser(user._id);
			await failMaxAttempts(user.username, `${password}-incorrect`);
		});

		it('should count failed attempts by user', async () => {
			const newUser = await createUser();

			await failMaxAttempts(user.username, `${password}-incorrect`);
			await shouldFailLoginWithUser(newUser.username, `${password}-incorrect`);
			await shouldSuccesfullyLoginWithUser(newUser.username, password);

			await deleteUser(newUser);
		});
	});

	describe('[Block by IP]', () => {
		let user: TestUser<IUser>;
		let user2: TestUser<IUser>;
		let userLogin: TestUser<IUser>;

		beforeEach(async () => {
			user = await createUser();
			user2 = await createUser();
			userLogin = await createUser();
		});

		afterEach(() => Promise.all([deleteUser(user), deleteUser(user2), deleteUser(userLogin)]));

		afterEach(async () => {
			// reset counter
			await sleep(ipBlockSeconds * 1000);
		});

		it('should block by IP when trying to login with one user and the limit amount of failed attempts is reached', async () => {
			await failMaxAttempts(user.username, `${password}-incorrect`);
			await sleep(userBlockSeconds * 1000);
			await failMaxAttempts(user.username, `${password}-incorrect`);

			await shouldBlockLogin(user.username, password, 'ip');
		});

		it('should block by IP when trying to login with multiple users and the limit amount of failed attempts is reached', async () => {
			await failMaxAttempts(user.username, `${password}-incorrect`);
			await failMaxAttempts(user2.username, `${password}-incorrect`);

			await shouldBlockLogin(userLogin.username, password, 'ip');
		});

		it('should unblock IP after block time', async () => {
			await failMaxAttempts(user.username, `${password}-incorrect`);
			await failMaxAttempts(user2.username, `${password}-incorrect`);

			await shouldBlockLogin(userLogin.username, password, 'ip');
			await sleep(ipBlockSeconds * 1000);
			await shouldSuccesfullyLoginWithUser(userLogin.username, password);
		}).timeout(20000);

		it('should reset counter of failed attempts after a successful login', async () => {
			await failMaxAttempts(user.username, `${password}-incorrect`);
			await failMaxAttempts(user2.username, `${password}-incorrect`);

			await sleep(ipBlockSeconds * 1000);
			await shouldFailLoginWithUser(userLogin.username, `${password}-incorrect`);
			await shouldSuccesfullyLoginWithUser(userLogin.username, password);
			await shouldLogoutUser(userLogin._id);

			await failMaxAttempts(user.username, `${password}-incorrect`);
			await failMaxAttempts(user2.username, `${password}-incorrect`);
			await shouldBlockLogin(userLogin.username, password, 'ip');
		}).timeout(20000);
	});
});
