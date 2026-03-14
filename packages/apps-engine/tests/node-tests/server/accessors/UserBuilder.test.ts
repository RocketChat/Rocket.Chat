import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IUser, IUserEmail } from '../../../../src/definition/users';
import { UserBuilder } from '../../../../src/server/accessors';

describe('UserBuilder', () => {
	it('basicUserBuilder', () => {
		assert.doesNotThrow(() => new UserBuilder());
	});

	it('settingOnUserBuilder', () => {
		const ubOnce = new UserBuilder();
		assert.strictEqual(ubOnce.setData({ name: 'Test User', email: 'testuser@gmail.com', username: 'testuser' } as Partial<IUser>), ubOnce);
		assert.strictEqual((ubOnce as any).user.name, 'Test User');
		assert.strictEqual((ubOnce as any).user.username, 'testuser');
		assert.strictEqual((ubOnce as any).user.email, 'testuser@gmail.com');

		const user: Partial<IUser> = {} as Partial<IUser>;
		const ub = new UserBuilder(user);

		assert.strictEqual(
			ub.setEmails([
				{
					address: 'testuser@gmail.com',
					verified: false,
				} as IUserEmail,
			]),
			ub,
		);
		assert.deepStrictEqual(user.emails, [
			{
				address: 'testuser@gmail.com',
				verified: false,
			} as IUserEmail,
		]);
		assert.deepStrictEqual(ub.getEmails(), [
			{
				address: 'testuser@gmail.com',
				verified: false,
			} as IUserEmail,
		]);

		assert.strictEqual(ub.setDisplayName('Test User'), ub);
		assert.deepStrictEqual(user.name, 'Test User');
		assert.deepStrictEqual(ub.getDisplayName(), 'Test User');

		assert.strictEqual(ub.setUsername('testuser'), ub);
		assert.deepStrictEqual(user.username, 'testuser');
		assert.deepStrictEqual(ub.getUsername(), 'testuser');

		assert.strictEqual(ub.setRoles(['bot']), ub);
		assert.deepStrictEqual(user.roles, ['bot']);
		assert.deepStrictEqual(ub.getRoles(), ['bot']);

		assert.strictEqual(ub.getUser(), user);
	});
});
