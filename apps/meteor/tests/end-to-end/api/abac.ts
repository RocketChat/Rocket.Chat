import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

// NOTE:
// The original request suggested using describe.only to focus on this suite,
// but the lint configuration disallows describe.only (diagnostic error).
// If you want to focus these tests locally, temporarily add `.only` and run them.
// All endpoints are accessed via direct URL strings to bypass the typed api() helper,
// since ABAC endpoints are not yet included in its union type (causing TS errors).

describe('[ABAC] (Enterprise Only)', function () {
	this.retries(0);

	let testRoom: IRoom;
	let unauthorizedUser: IUser;
	let unauthorizedCredentials: Credentials;

	const initialKey = `attr_${Date.now()}`;
	const updatedKey = `${initialKey}_renamed`;
	const anotherKey = `${initialKey}_another`;
	let attributeId: string;

	before((done) => getCredentials(done));

	before(async () => {
		await updatePermission('abac-management', ['admin']);
		await updateSetting('ABAC_Enabled', true);

		testRoom = (await createRoom({ type: 'p', name: `abac-test-${Date.now()}` })).body.group;

		unauthorizedUser = await createUser();
		unauthorizedCredentials = await login(unauthorizedUser.username, password);
	});

	after(async () => {
		await deleteRoom({ type: 'p', roomId: testRoom._id });
		await deleteUser(unauthorizedUser);
	});

	const v1 = '/api/v1';

	describe('Permission & Authentication', () => {
		it('GET /api/v1/abac/attributes should return 401 when not authenticated', async () => {
			await request.get(`${v1}/abac/attributes`).expect(401);
		});

		it('POST /api/v1/abac/attributes should return 403 for user without abac-management permission', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(unauthorizedCredentials)
				.send({ key: 'nokey', values: ['v1'] })
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('Attribute Definition - Validations & CRUD', () => {
		it('POST should fail with invalid key pattern (space)', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: 'invalid key with space', values: ['one'] })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('POST should fail with duplicate values', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: anotherKey, values: ['dup', 'dup'] })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('POST should fail with empty values array', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: `${anotherKey}_empty`, values: [] })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('POST should fail with > 10 values', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({
					key: `${anotherKey}_toolong`,
					values: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v11'],
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('POST should create a valid attribute definition', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: initialKey, values: ['red', 'green', 'blue'] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('POST should fail creating duplicate key', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: initialKey, values: ['another'] })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('GET should list attributes including the created one', async () => {
			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ key: initialKey })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('attributes').that.is.an('array');
					const found = res.body.attributes.find((a: any) => a.key === initialKey);
					expect(found).to.exist;
					expect(found).to.have.property('_id');
					attributeId = found._id;
				});
		});

		it('GET should fail when count > 100', async () => {
			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ count: 101 })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('GET by id should retrieve attribute definition', async () => {
			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('key', initialKey);
					expect(res.body).to.have.property('values').that.is.an('array');
				});
		});

		it('PUT should fail with empty body (needs key or values)', async () => {
			await request
				.put(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('PUT should update values only', async () => {
			await request
				.put(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.send({ values: ['cyan', 'magenta', 'yellow'] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.values).to.deep.equal(['cyan', 'magenta', 'yellow']);
				});
		});

		it('PUT should update key only', async () => {
			await request
				.put(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.send({ key: updatedKey })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('key', updatedKey);
				});
		});
	});

	describe('Room Attribute Operations', () => {
		it('GET is-in-use should initially be false (no room usage yet)', async () => {
			await request
				.get(`${v1}/abac/attributes/${updatedKey}/is-in-use`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('inUse', false);
				});
			// Also check per-value usage map (all false)
			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('usage');
					expect((Object.values(res.body.usage) as boolean[]).every((v) => v === false)).to.be.true;
				});
		});

		it('POST room attribute should fail with duplicate values', async () => {
			await request
				.post(`${v1}/abac/room/${testRoom._id}/attributes/${updatedKey}`)
				.set(credentials)
				.send({ values: ['dup', 'dup'] })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('POST room attribute should add values and reflect usage/inUse=true', async () => {
			await request
				.post(`${v1}/abac/room/${testRoom._id}/attributes/${updatedKey}`)
				.set(credentials)
				.send({ values: ['cyan'] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			// inUse endpoint should now be true
			await request
				.get(`${v1}/abac/attributes/${updatedKey}/is-in-use`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.inUse).to.be.true;
				});

			// usage map: cyan true, others false
			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('usage');
					expect(res.body.usage).to.have.property('cyan', true);
					// magenta & yellow not in use yet
					if (res.body.usage.magenta !== undefined) expect(res.body.usage.magenta).to.be.false;
					if (res.body.usage.yellow !== undefined) expect(res.body.usage.yellow).to.be.false;
				});
		});

		it('PUT room attribute should replace values and update usage map accordingly', async () => {
			await request
				.put(`${v1}/abac/room/${testRoom._id}/attributes/${updatedKey}`)
				.set(credentials)
				.send({ values: ['magenta', 'yellow'] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			// usage now: magenta true, yellow true, cyan false
			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.usage).to.have.property('magenta', true);
					expect(res.body.usage).to.have.property('yellow', true);
					if (res.body.usage.cyan !== undefined) expect(res.body.usage.cyan).to.be.false;
				});

			// inUse should remain true
			await request
				.get(`${v1}/abac/attributes/${updatedKey}/is-in-use`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.inUse).to.be.true;
				});
		});

		it('DELETE room attribute key should succeed and clear usage/inUse=false', async () => {
			await request
				.delete(`${v1}/abac/room/${testRoom._id}/attributes/${updatedKey}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			// usage all false again
			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect((Object.values(res.body.usage) as boolean[]).every((v) => v === false)).to.be.true;
				});

			await request
				.get(`${v1}/abac/attributes/${updatedKey}/is-in-use`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.inUse).to.be.false;
				});
		});

		it('POST (replace-all) should currently fail while ABAC enabled due to inverted check (documenting behavior)', async () => {
			// Endpoint code throws error-abac-not-enabled when ABAC_Enabled === true (likely a bug).
			await request
				.post(`${v1}/abac/room/${testRoom._id}/attributes`)
				.set(credentials)
				.send({ attributes: { [updatedKey]: ['cyan'] } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').that.includes('error-abac-not-enabled');
				});
		});

		it('DELETE all room attributes should succeed even if ABAC disabled', async () => {
			await updateSetting('ABAC_Enabled', false);

			await request
				.delete(`${v1}/abac/room/${testRoom._id}/attributes`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await updateSetting('ABAC_Enabled', true);
		});
	});

	describe('Usage & Deletion', () => {
		it('POST add room usage for attribute (re-add after clearing) and expect delete while in use to fail', async () => {
			await request
				.post(`${v1}/abac/room/${testRoom._id}/attributes/${updatedKey}`)
				.set(credentials)
				.send({ values: ['cyan'] })
				.expect(200);

			// Attempt to delete attribute while in use should fail
			await request
				.delete(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').that.includes('error-attribute-in-use');
				});
		});

		it('GET is-in-use should reflect usage true before clearing, then false after removal', async () => {
			await request
				.get(`${v1}/abac/attributes/${updatedKey}/is-in-use`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.inUse).to.be.true;
				});

			// Remove room attribute again
			await request.delete(`${v1}/abac/room/${testRoom._id}/attributes/${updatedKey}`).set(credentials).expect(200);

			await request
				.get(`${v1}/abac/attributes/${updatedKey}/is-in-use`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.inUse).to.be.false;
				});
		});

		it('DELETE attribute definition should now succeed (no room usage)', async () => {
			await request
				.delete(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});
});
