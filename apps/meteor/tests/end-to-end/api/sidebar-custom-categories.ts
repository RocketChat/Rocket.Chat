import type { Credentials } from '@rocket.chat/api-client';
import type { ISidebarCategory, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { createRoom, deleteRoom, getSubscriptionByRoomId, addUserToRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, login, deleteUser } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const experimentalEndpoint = (path: string) => `/api/experimental/${path}`;

/**
 * Persistence + validation of the `sidebarCategories` user preference (custom sidebar categories).
 *
 * The feature has no dedicated endpoint — categories are stored on the user preferences and round-trip
 * through `users.setPreferences` / `users.getPreferences`. The REST schema validates each entry with
 * `required: ['_id', 'name']` and `additionalProperties: false`, so malformed payloads are rejected.
 */
describe('[Sidebar Custom Categories]', () => {
	let testUser: IUser;
	let testUserCredentials: Credentials;

	const category = (overrides: Partial<ISidebarCategory> = {}): ISidebarCategory => ({
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
			.send({ data: { sidebarCategories: data } });

	describe('persistence', () => {
		it('should persist a minimal category (only the required _id + name)', async () => {
			const categories = [category({ name: 'Projects' })];

			await setCategories(categories)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.user.settings.preferences).to.have.property('sidebarCategories').that.is.an('array').with.lengthOf(1);
				});

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.preferences.sidebarCategories).to.deep.equal(categories);
				});
		});

		it('should persist the optional showUnreads field verbatim', async () => {
			const categories = [category({ name: 'Team', showUnreads: false }), category({ name: 'Personal', showUnreads: true })];

			await setCategories(categories).expect(200);

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.preferences.sidebarCategories).to.deep.equal(categories);
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
					expect(res.body.preferences.sidebarCategories.map((c: ISidebarCategory) => c.name)).to.deep.equal(['A', 'B', 'C']);
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
					expect(res.body.preferences.sidebarCategories).to.have.lengthOf(1);
					expect(res.body.preferences.sidebarCategories[0]).to.have.property('name', 'second');
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
					expect(res.body.preferences.sidebarCategories).to.be.an('array').with.lengthOf(0);
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
				.send({ data: { sidebarCategories: [] } })
				.expect(401);
		});
	});

	describe('permissions', () => {
		it("should let an admin set another user's sidebarCategories", async () => {
			const categories = [category({ name: 'set-by-admin' })];

			await request
				.post(api('users.setPreferences'))
				.set(credentials)
				.send({ userId: testUser._id, data: { sidebarCategories: categories } })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('users.getPreferences'))
				.set(testUserCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.preferences.sidebarCategories).to.deep.equal(categories);
				});
		});
	});

	(IS_EE ? describe : describe.skip)('[Experimental] rooms.setCategory', () => {
		let catId: string;
		let roomId: string;
		let roomId2: string;

		const setCategory = (body: object, creds: Credentials = testUserCredentials) =>
			request.post(experimentalEndpoint('rooms.setCategory')).set(creds).send(body);

		before(async () => {
			catId = Random.id();
			await setCategories([{ _id: catId, name: 'E2E Cat' }]);

			// Create rooms as admin (regular users lack create-c permission by default),
			// then invite the test user so they are subscribed.
			const r1 = await createRoom({ type: 'c', name: `setcat-${Random.id()}` }).expect(200);
			roomId = r1.body.channel._id;
			await addUserToRoom({ usernames: [testUser.username as string], rid: roomId, type: 'c' });

			const r2 = await createRoom({ type: 'c', name: `setcat-${Random.id()}` }).expect(200);
			roomId2 = r2.body.channel._id;
			await addUserToRoom({ usernames: [testUser.username as string], rid: roomId2, type: 'c' });
		});

		after(async () => {
			await setCategories([]);
			await Promise.all([
				...(roomId ? [deleteRoom({ type: 'c', roomId })] : []),
				...(roomId2 ? [deleteRoom({ type: 'c', roomId: roomId2 })] : []),
			]);
		});

		it('should assign a room to a category and persist it on the subscription', async () => {
			await setCategory({ roomIds: [roomId], category: catId })
				.expect(200)
				.expect((res) => expect(res.body).to.have.property('success', true));

			const sub = await getSubscriptionByRoomId(roomId, testUserCredentials);
			expect(sub).to.have.property('category', catId);
		});

		it('should unassign a room from its category when category is null', async () => {
			await setCategory({ roomIds: [roomId], category: catId }).expect(200);
			await setCategory({ roomIds: [roomId], category: null }).expect(200);

			const sub = await getSubscriptionByRoomId(roomId, testUserCredentials);
			expect(sub).to.not.have.property('category');
		});

		it('should assign multiple rooms to a category in one call', async () => {
			await setCategory({ roomIds: [roomId, roomId2], category: catId }).expect(200);

			const [s1, s2] = await Promise.all([
				getSubscriptionByRoomId(roomId, testUserCredentials),
				getSubscriptionByRoomId(roomId2, testUserCredentials),
			]);
			expect(s1).to.have.property('category', catId);
			expect(s2).to.have.property('category', catId);
		});

		it('should reject duplicate roomIds', async () => {
			await setCategory({ roomIds: [roomId, roomId], category: catId }).expect(400);
		});

		it('should return 401 when not authenticated', async () => {
			await request
				.post(experimentalEndpoint('rooms.setCategory'))
				.send({ roomIds: [roomId], category: catId })
				.expect(401);
		});

		describe('validation', () => {
			it('should reject a missing roomIds field', async () => {
				await setCategory({ category: catId }).expect(400);
			});

			it('should reject an empty roomIds array (minItems: 1)', async () => {
				await setCategory({ roomIds: [], category: catId }).expect(400);
			});

			it('should reject a missing category field', async () => {
				await setCategory({ roomIds: [roomId] }).expect(400);
			});

			it('should reject unknown properties (additionalProperties: false)', async () => {
				await setCategory({ roomIds: [roomId], category: catId, extra: true }).expect(400);
			});
		});

		describe('business logic', () => {
			it('should reject a category id not found in the user preferences', async () => {
				await setCategory({ roomIds: [roomId], category: Random.id() })
					.expect(400)
					.expect((res) => expect(res.body).to.have.property('success', false));
			});

			it('should silently skip a room the user is not subscribed to', async () => {
				const adminRoom = await createRoom({ type: 'c', name: `admin-only-${Random.id()}` }).expect(200);
				const adminRoomId = adminRoom.body.channel._id;
				try {
					await setCategory({ roomIds: [adminRoomId], category: catId }).expect(200);
					// The subscription for adminRoom belongs to the admin, not testUser — setCategoryByRoomIdsAndUserId
					// filters by userId, so the unsubscribed room is silently ignored.
					const sub = await getSubscriptionByRoomId(adminRoomId, credentials);
					expect(sub).to.not.have.property('category');
				} finally {
					await deleteRoom({ type: 'c', roomId: adminRoomId });
				}
			});

			it('should remove a room from favorites when assigning it to a category', async () => {
				// First favorite the room
				await request.post(api('rooms.favorite')).set(testUserCredentials).send({ roomId, favorite: true }).expect(200);
				let sub = await getSubscriptionByRoomId(roomId, testUserCredentials);
				expect(sub).to.have.property('f', true);
				expect(sub).to.not.have.property('category');

				// Now assign it to a category — server atomically unsets f
				await setCategory({ roomIds: [roomId], category: catId }).expect(200);
				sub = await getSubscriptionByRoomId(roomId, testUserCredentials);
				expect(sub).to.have.property('category', catId);
				expect(sub).to.have.property('f', false);
			});

			it('should remove a room from its category when favoriting it', async () => {
				// First assign the room to a category
				await setCategory({ roomIds: [roomId], category: catId }).expect(200);
				let sub = await getSubscriptionByRoomId(roomId, testUserCredentials);
				expect(sub).to.have.property('category', catId);

				// Now favorite it — server atomically unsets category
				await request.post(api('rooms.favorite')).set(testUserCredentials).send({ roomId, favorite: true }).expect(200);
				sub = await getSubscriptionByRoomId(roomId, testUserCredentials);
				expect(sub).to.have.property('f', true);
				expect(sub).to.not.have.property('category');
			});
		});
	});
});
