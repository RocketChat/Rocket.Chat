import type { Credentials } from '@rocket.chat/api-client';
import type { ISidebarCustomCategory, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { password } from '../../data/user';
import { createUser, login, deleteUser } from '../../data/users.helper';

/**
 * Persistence + validation of the `sidebarCustomCategories` user preference (custom sidebar categories).
 *
 * The feature has no dedicated endpoint — categories are stored on the user preferences and round-trip
 * through `users.setPreferences` / `users.getPreferences`. The REST schema validates each entry with
 * `required: ['_id', 'name']` and `additionalProperties: false`, so malformed payloads are rejected.
 */
describe('[Sidebar Custom Categories]', () => {
	let testUser: IUser;
	let testUserCredentials: Credentials;

	const category = (overrides: Partial<ISidebarCustomCategory> = {}): ISidebarCustomCategory => ({
		_id: Random.id(),
		name: `category-${Random.id()}`,
		...overrides,
	});

	before((done) => getCredentials(done));

	before(async () => {
		testUser = await createUser();
		testUserCredentials = await login(testUser.username, password);
	});

	after(() => deleteUser(testUser));

	const setCategories = (data: unknown, asCredentials: Credentials = testUserCredentials) =>
		request
			.post(api('users.setPreferences'))
			.set(asCredentials)
			.send({ data: { sidebarCustomCategories: data } });

	describe('persistence', () => {
		it('should persist a minimal category (only the required _id + name)', async () => {
			const categories = [category({ name: 'Projects' })];

			await setCategories(categories)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.user.settings.preferences).to.have.property('sidebarCustomCategories').that.is.an('array').with.lengthOf(1);
				});

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.preferences.sidebarCustomCategories).to.deep.equal(categories);
				});
		});

		it('should persist the optional showUnreads and rooms fields verbatim', async () => {
			const categories = [
				category({ name: 'Team', showUnreads: false, rooms: ['rid-1', 'rid-2'] }),
				category({ name: 'Personal', showUnreads: true, rooms: [] }),
			];

			await setCategories(categories).expect(200);

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.preferences.sidebarCustomCategories).to.deep.equal(categories);
				});
		});

		it('should preserve the array order (order is the render order)', async () => {
			const categories = [category({ name: 'A' }), category({ name: 'B' }), category({ name: 'C' })];

			await setCategories(categories).expect(200);

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.preferences.sidebarCustomCategories.map((c: ISidebarCustomCategory) => c.name)).to.deep.equal(['A', 'B', 'C']);
				});
		});

		it('should replace the whole array on each write (read-modify-write semantics)', async () => {
			await setCategories([category({ name: 'first' })]).expect(200);
			const replacement = [category({ name: 'second' })];
			await setCategories(replacement).expect(200);

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.preferences.sidebarCustomCategories).to.have.lengthOf(1);
					expect(res.body.preferences.sidebarCustomCategories[0]).to.have.property('name', 'second');
				});
		});

		it('should accept an empty array (clearing all categories)', async () => {
			await setCategories([category({ name: 'temp' })]).expect(200);
			await setCategories([]).expect(200);

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.preferences.sidebarCustomCategories).to.be.an('array').with.lengthOf(0);
				});
		});
	});

	describe('validation', () => {
		const expectInvalid = (res: { body: { success: boolean; errorType: string } }) => {
			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'invalid-params');
		};

		// NOTE: the shared ajv instance runs with `coerceTypes`, so a scalar type mismatch on a coercible
		// field (e.g. a numeric `name`, or a numeric entry in `rooms`) is coerced to the schema type and
		// accepted rather than rejected. The assertions below therefore cover the constraints coercion
		// cannot satisfy: missing required fields, unknown properties, a non-array root, and a value that
		// cannot be coerced to the target type.

		it('should reject an entry missing the required "name"', async () => {
			await setCategories([{ _id: Random.id() }])
				.expect(400)
				.expect(expectInvalid);
		});

		it('should reject an entry missing the required "_id"', async () => {
			await setCategories([{ name: 'no-id' }])
				.expect(400)
				.expect(expectInvalid);
		});

		it('should reject an unknown property on an entry (additionalProperties: false)', async () => {
			await setCategories([{ _id: Random.id(), name: 'x', color: 'red' }])
				.expect(400)
				.expect(expectInvalid);
		});

		it('should reject a non-array value', async () => {
			await setCategories({ _id: Random.id(), name: 'not-an-array' }).expect(400).expect(expectInvalid);
		});

		it('should reject a "showUnreads" that cannot be coerced to a boolean', async () => {
			await setCategories([{ _id: Random.id(), name: 'x', showUnreads: 'yes' }])
				.expect(400)
				.expect(expectInvalid);
		});

		it('should return 401 when not authenticated', async () => {
			await request
				.post(api('users.setPreferences'))
				.send({ data: { sidebarCustomCategories: [] } })
				.expect(401);
		});
	});

	describe('permissions', () => {
		it("should let an admin set another user's sidebarCustomCategories", async () => {
			const categories = [category({ name: 'set-by-admin' })];

			await request
				.post(api('users.setPreferences'))
				.set(credentials)
				.send({ userId: testUser._id, data: { sidebarCustomCategories: categories } })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.preferences.sidebarCustomCategories).to.deep.equal(categories);
				});
		});
	});
});
