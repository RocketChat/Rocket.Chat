import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[ABAC] (Enterprise Only)', function () {
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

	describe('Extended Validations & Edge Cases', () => {
		let firstAttributeId: string;
		let secondAttributeId: string;
		const firstKey = `${initialKey}_first`;
		const secondKey = `${initialKey}_second`;
		const bulkAttrPrefix = `bulk_${Date.now()}`;
		const tempKeyForPattern = `Tmp${Date.now()}`;
		const invalidCharKey = `bad*key`;
		const invalidCharValue = `bad*value`;
		const randomId = 'nonExistingId1234567890';

		it('POST should create a second attribute definition for conflict tests', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: secondKey, values: ['alpha', 'beta', 'gamma'] })
				.expect(200);

			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ key: secondKey })
				.expect(200)
				.expect((res) => {
					const found = res.body.attributes.find((a: any) => a.key === secondKey);
					expect(found).to.exist;
					secondAttributeId = found._id;
				});
		});

		it('POST should create an attribute definition for conflicts', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: firstKey, values: ['alpha', 'beta', 'gamma'] })
				.expect(200);

			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ key: firstKey })
				.expect(200)
				.expect((res) => {
					const found = res.body.attributes.find((a: any) => a.key === firstKey);
					expect(found).to.exist;
					firstAttributeId = found._id;
				});
		});

		it('PUT attribute should fail when renaming to an existing key (duplicate key)', async () => {
			await request
				.put(`${v1}/abac/attributes/${secondAttributeId}`)
				.set(credentials)
				.send({ key: firstKey })
				.expect(400)
				.expect((res) => {
					expect(res.body.success).to.be.false;
				});
		});

		it('PUT attribute should fail when values array has duplicates', async () => {
			await request
				.put(`${v1}/abac/attributes/${secondAttributeId}`)
				.set(credentials)
				.send({ values: ['alpha', 'alpha'] })
				.expect(400);
		});

		it('PUT attribute should fail when values array > 10', async () => {
			const eleven = Array.from({ length: 11 }, (_, i) => `v${i}`);
			await request.put(`${v1}/abac/attributes/${secondAttributeId}`).set(credentials).send({ values: eleven }).expect(400);
		});

		it('PUT attribute should fail when values array empty', async () => {
			await request.put(`${v1}/abac/attributes/${secondAttributeId}`).set(credentials).send({ values: [] }).expect(400);
		});

		it('GET attribute by invalid/non-existing id should fail', async () => {
			await request.get(`${v1}/abac/attributes/${randomId}`).set(credentials).expect(400);
		});

		it('DELETE attribute by invalid/non-existing id should fail', async () => {
			await request.delete(`${v1}/abac/attributes/${randomId}`).set(credentials).expect(400);
		});

		it('PUT attribute by invalid/non-existing id should fail', async () => {
			await request
				.put(`${v1}/abac/attributes/${randomId}`)
				.set(credentials)
				.send({ key: `${tempKeyForPattern}_X` })
				.expect(400);
		});

		it('POST attribute should fail with invalid key pattern (special char)', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: invalidCharKey, values: ['ok'] })
				.expect(400);
		});

		it('POST attribute should fail with invalid value pattern (special char in value)', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: `${tempKeyForPattern}_values`, values: [invalidCharValue] })
				.expect(400);
		});

		it('POST attribute should succeed with exactly 10 values (boundary)', async () => {
			const tenValues = Array.from({ length: 10 }, (_, i) => `b${i}`);
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: `${tempKeyForPattern}_maxvals`, values: tenValues })
				.expect(200);
		});

		it('GET attributes with count=100 should succeed (boundary)', async () => {
			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ count: 100 })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('count');
				});
		});

		it('GET attributes should fail with count=0 (schema min=1)', async () => {
			await request.get(`${v1}/abac/attributes`).set(credentials).query({ count: 0 }).expect(400);
		});

		it('GET attributes should fail with negative offset', async () => {
			await request.get(`${v1}/abac/attributes`).set(credentials).query({ offset: -1 }).expect(400);
		});

		it('GET attributes should fail with unexpected extra query parameter', async () => {
			await request.get(`${v1}/abac/attributes`).set(credentials).query({ extraneous: 'param' }).expect(400);
		});

		it('GET attributes should fail with invalid value pattern in values filter', async () => {
			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ values: [invalidCharValue] })
				.expect(400);
		});

		it('GET attributes should filter by values when valid (expect subset or empty)', async () => {
			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ 'values[]': 'magenta' })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
				});
		});

		describe('Room attribute bulk operations validations', () => {
			it('POST bulk room attributes should fail when more than 10 distinct attribute keys provided', async () => {
				const tooMany: Record<string, string[]> = {};
				for (let i = 0; i < 11; i++) tooMany[`${bulkAttrPrefix}_${i}`] = ['v1'];
				await request.post(`${v1}/abac/room/${testRoom._id}/attributes`).set(credentials).send({ attributes: tooMany }).expect(400);
			});

			it('POST bulk room attributes should fail when one attribute has >10 values', async () => {
				const bigValues = Array.from({ length: 11 }, (_, i) => `v${i}`);
				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes`)
					.set(credentials)
					.send({ attributes: { [`${bulkAttrPrefix}_k1`]: bigValues } })
					.expect(400);
			});

			it('POST bulk room attributes should fail when using a value not in attribute definition', async () => {
				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes`)
					.set(credentials)
					.send({ attributes: { [secondKey]: ['alpha', 'delta'] } })
					.expect(400);
			});

			it('POST bulk room attributes should succeed when providing valid subset for existing definitions', async () => {
				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes`)
					.set(credentials)
					.send({
						attributes: {
							[secondKey]: ['alpha', 'beta'],
						},
					})
					.expect(200);
			});
		});

		describe('Room attribute key/value validation edge cases', () => {
			it('POST single room attribute should fail with >10 values', async () => {
				const eleven = Array.from({ length: 11 }, (_, i) => `x${i}`);
				await request.post(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`).set(credentials).send({ values: eleven }).expect(400);
			});

			it('POST single room attribute should fail when value not allowed by definition', async () => {
				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['alpha', 'zzz'] })
					.expect(400);
			});

			it('PUT single room attribute should fail with value not in definition', async () => {
				await request
					.put(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['gamma', 'invalid'] })
					.expect(400);
			});
		});

		describe('Room attribute limits (max 10 attribute keys)', () => {
			const tempAttrKeys: string[] = [];
			it('Reset room attributes before limit test and populate with 10 keys', async () => {
				await request.delete(`${v1}/abac/room/${testRoom._id}/attributes`).set(credentials).expect(200);

				const timestamp = Date.now();
				const keys = Array.from({ length: 10 }, (_, i) => `limitk_${timestamp}_${i}`);
				tempAttrKeys.push(...keys);
				await Promise.all(
					keys.map((k) =>
						request
							.post(`${v1}/abac/attributes`)
							.set(credentials)
							.send({ key: k, values: ['v1'] })
							.expect(200)
							.then(() =>
								request
									.post(`${v1}/abac/room/${testRoom._id}/attributes/${k}`)
									.set(credentials)
									.send({ values: ['v1'] })
									.expect(200),
							),
					),
				);
			});

			it('Adding an 11th attribute key to room should fail', async () => {
				const extraKey = `limitk_extra_${Date.now()}`;
				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: extraKey, values: ['v1'] })
					.expect(200);

				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes/${extraKey}`)
					.set(credentials)
					.send({ values: ['v1'] })
					.expect(400);
			});
		});

		describe('Permission & Auth extended checks', () => {
			it('POST /abac/room/:rid/attributes/:key should return 403 for unauthorized user', async () => {
				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`)
					.set(unauthorizedCredentials)
					.send({ values: ['alpha'] })
					.expect(403);
			});

			it('PUT /abac/room/:rid/attributes/:key should return 403 for unauthorized user', async () => {
				await request
					.put(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`)
					.set(unauthorizedCredentials)
					.send({ values: ['alpha'] })
					.expect(403);
			});

			it('DELETE /abac/room/:rid/attributes/:key should return 403 for unauthorized user', async () => {
				await request.delete(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`).set(unauthorizedCredentials).expect(403);
			});

			it('GET /abac/attributes/:key/is-in-use should return 403 for unauthorized user', async () => {
				await request.get(`${v1}/abac/attributes/${secondKey}/is-in-use`).set(unauthorizedCredentials).expect(403);
			});
		});

		describe('ABAC Disabled behavior for protected endpoints', () => {
			before(async () => {
				await updateSetting('ABAC_Enabled', false);
			});

			it('POST /abac/attributes should fail with error-abac-not-enabled', async () => {
				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: `disabled_${Date.now()}`, values: ['one'] })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('GET /abac/attributes should fail while disabled', async () => {
				await request
					.get(`${v1}/abac/attributes`)
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('GET /abac/attributes/:_id should fail while disabled', async () => {
				await request
					.get(`${v1}/abac/attributes/${secondAttributeId}`)
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('PUT /abac/attributes/:_id should fail while disabled', async () => {
				await request
					.put(`${v1}/abac/attributes/${secondAttributeId}`)
					.set(credentials)
					.send({ values: ['alpha'] })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('DELETE /abac/attributes/:_id should fail while disabled', async () => {
				await request
					.delete(`${v1}/abac/attributes/${secondAttributeId}`)
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('GET /abac/attributes/:key/is-in-use should fail while disabled', async () => {
				await request
					.get(`${v1}/abac/attributes/${secondKey}/is-in-use`)
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('POST /abac/room/:rid/attributes/:key should fail while disabled', async () => {
				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['alpha'] })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('PUT /abac/room/:rid/attributes/:key should fail while disabled', async () => {
				await request
					.put(`${v1}/abac/room/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['alpha'] })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('POST /abac/room/:rid/attributes (bulk replace) should fail while disabled', async () => {
				await request
					.post(`${v1}/abac/room/${testRoom._id}/attributes`)
					.set(credentials)
					.send({ attributes: { [secondKey]: ['alpha'] } })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			after(async () => {
				await updateSetting('ABAC_Enabled', true);
			});
		});
	});
});
