import type { Credentials } from '@rocket.chat/api-client';
import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { getCredentials, request, credentials } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { deleteTeam } from '../../data/teams.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

// NOTE: This manipulates the DB directly to add ABAC attributes to a user
// The idea is to avoid having to go through LDAP to add info to the user
let connection: MongoClient;
const addAbacAttributesToUserDirectly = async (userId: string, abacAttributes: IAbacAttributeDefinition[]) => {
	await connection.db().collection('users').updateOne(
		{
			// @ts-expect-error - collection types for _id
			_id: userId,
		},
		{ $set: { abacAttributes } },
	);
};

(IS_EE ? describe : describe.skip)('[ABAC] (Enterprise Only)', function () {
	this.retries(0);

	let testRoom: IRoom;
	let unauthorizedUser: IUser;
	let unauthorizedCredentials: Credentials;

	const initialKey = `attr_${Date.now()}`;
	const updatedKey = `${initialKey}_renamed`;
	const anotherKey = `${initialKey}_another`;
	let attributeId: string;
	let paginationBase: string;
	let page1AttributeIds: string[] = [];

	before((done) => getCredentials(done));

	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);

		await updatePermission('abac-management', ['admin']);
		await updateSetting('ABAC_Enabled', true);

		testRoom = (await createRoom({ type: 'p', name: `abac-test-${Date.now()}` })).body.group;

		unauthorizedUser = await createUser();
		unauthorizedCredentials = await login(unauthorizedUser.username, password);
	});

	after(async () => {
		await deleteRoom({ type: 'p', roomId: testRoom._id });
		await deleteUser(unauthorizedUser);
		await updateSetting('ABAC_Enabled', false);

		await connection.close();
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
			const response = await request.get(`${v1}/abac/attributes`).set(credentials).expect(200);
			console.log(response.body);
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

		it('GET should paginate attributes (page 1)', async () => {
			paginationBase = `pg_${Date.now()}`;
			await Promise.all(
				['a', 'b', 'c'].map((suffix) =>
					request
						.post(`${v1}/abac/attributes`)
						.set(credentials)
						.send({ key: `${paginationBase}_${suffix}`, values: ['one'] })
						.expect(200),
				),
			);

			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ count: 2, offset: 0 })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('count', 2);
					expect(res.body).to.have.property('total').that.is.a('number').and.to.be.at.least(4);
					expect(res.body).to.have.property('attributes').that.is.an('array').with.lengthOf(2);
					page1AttributeIds = res.body.attributes.map((a: any) => a._id);
				});
		});

		it('GET should paginate attributes (page 2)', async () => {
			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ count: 2, offset: 2 })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset', 2);
					expect(res.body).to.have.property('count').that.is.a('number');
					expect(res.body.count).to.be.at.most(2);
					expect(res.body).to.have.property('total').that.is.a('number').and.to.be.at.least(4);
					expect(res.body).to.have.property('attributes').that.is.an('array');
					const page2Ids = res.body.attributes.map((a: any) => a._id);
					page2Ids.forEach((id: string) => {
						expect(page1AttributeIds).to.not.include(id);
					});
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
				.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${updatedKey}`)
				.set(credentials)
				.send({ values: ['dup', 'dup'] })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('POST room attribute should add values and reflect usage/inUse=true', async () => {
			await request
				.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${updatedKey}`)
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
				.put(`${v1}/abac/rooms/${testRoom._id}/attributes/${updatedKey}`)
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
				.delete(`${v1}/abac/rooms/${testRoom._id}/attributes/${updatedKey}`)
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
				.delete(`${v1}/abac/rooms/${testRoom._id}/attributes`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await updateSetting('ABAC_Enabled', true);
		});
	});

	describe('Default and Team Default Room Restrictions', () => {
		let privateDefaultRoomId: string;
		let teamId: string;
		let teamPrivateRoomId: string;
		let teamDefaultRoomId: string;
		const localAbacKey = `default_team_test_${Date.now()}`;
		let mainRoomIdSaveSettings: string;
		const teamName = `abac-team-${Date.now()}`;
		const teamNameMainRoom = `abac-team-main-save-settings-${Date.now()}`;

		before('create team main room for rooms.saveRoomSettings default restriction test', async () => {
			const createTeamMain = await request
				.post(`${v1}/teams.create`)
				.set(credentials)
				.send({ name: teamNameMainRoom, type: 1 })
				.expect(200);

			mainRoomIdSaveSettings = createTeamMain.body.team?.roomId;

			await request.post(`${v1}/rooms.saveRoomSettings`).set(credentials).send({ rid: mainRoomIdSaveSettings, default: true }).expect(200);
		});

		before('create local ABAC attribute definition for tests', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: localAbacKey, values: ['red', 'green'] })
				.expect(200);
		});

		before('create private room and try to set it as default', async () => {
			const res = await createRoom({
				type: 'p',
				name: `abac-default-room-${Date.now()}`,
			});
			privateDefaultRoomId = res.body.group._id;

			await request.post(`${v1}/rooms.saveRoomSettings`).set(credentials).send({ rid: privateDefaultRoomId, default: true }).expect(200);
		});

		before('create private team, private room inside it and set as team default', async () => {
			const createTeamRes = await request.post(`${v1}/teams.create`).set(credentials).send({ name: teamName, type: 0 }).expect(200);
			teamId = createTeamRes.body.team._id;

			const roomRes = await createRoom({
				type: 'p',
				name: `abac-team-room-${Date.now()}`,
				extraData: { teamId },
			});
			teamPrivateRoomId = roomRes.body.group._id;

			const setDefaultRes = await request
				.post(`${v1}/teams.updateRoom`)
				.set(credentials)
				.send({ teamId, roomId: teamPrivateRoomId, isDefault: true })
				.expect(200);

			if (setDefaultRes.body?.room?.teamDefault) {
				teamDefaultRoomId = teamPrivateRoomId;
			}
		});

		it('should fail adding ABAC attribute to private default room', async () => {
			await request
				.post(`${v1}/abac/rooms/${privateDefaultRoomId}/attributes/${localAbacKey}`)
				.set(credentials)
				.send({ values: ['red'] })
				.expect(400)
				.expect((res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.include('error-cannot-convert-default-room-to-abac');
				});
		});

		it('should fail adding ABAC attribute to team default private room', async () => {
			await request
				.post(`${v1}/abac/rooms/${teamDefaultRoomId}/attributes/${localAbacKey}`)
				.set(credentials)
				.send({ values: ['red'] })
				.expect(400)
				.expect((res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.include('error-cannot-convert-default-room-to-abac');
				});
		});

		it('should allow adding ABAC attribute after removing default flag from private room', async () => {
			await request.post(`${v1}/rooms.saveRoomSettings`).set(credentials).send({ rid: privateDefaultRoomId, default: false }).expect(200);

			await request
				.post(`${v1}/abac/rooms/${privateDefaultRoomId}/attributes/${localAbacKey}`)
				.set(credentials)
				.send({ values: ['red'] })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
				});
		});

		it('should allow adding ABAC attribute after removing team default flag', async () => {
			await request
				.post(`${v1}/teams.updateRoom`)
				.set(credentials)
				.send({ teamId, roomId: teamDefaultRoomId, isDefault: false })
				.expect(200);

			await request
				.post(`${v1}/abac/rooms/${teamDefaultRoomId}/attributes/${localAbacKey}`)
				.set(credentials)
				.send({ values: ['green'] })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
				});
		});

		it('should enforce restriction on team main room when default using rooms.saveRoomSettings', async () => {
			await request
				.post(`${v1}/abac/rooms/${mainRoomIdSaveSettings}/attributes/${localAbacKey}`)
				.set(credentials)
				.send({ values: ['red'] })
				.expect(400)
				.expect((res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.include('error-cannot-convert-default-room-to-abac');
				});

			await request.post(`${v1}/rooms.saveRoomSettings`).set(credentials).send({ rid: mainRoomIdSaveSettings, default: false }).expect(200);

			await request
				.post(`${v1}/abac/rooms/${mainRoomIdSaveSettings}/attributes/${localAbacKey}`)
				.set(credentials)
				.send({ values: ['red'] })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
				});
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId: privateDefaultRoomId });
			await deleteTeam(credentials, teamName);
			await deleteTeam(credentials, teamNameMainRoom);
		});
	});

	describe('Usage & Deletion', () => {
		it('POST add room usage for attribute (re-add after clearing) and expect delete while in use to fail', async () => {
			await request
				.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${updatedKey}`)
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
			await request.delete(`${v1}/abac/rooms/${testRoom._id}/attributes/${updatedKey}`).set(credentials).expect(200);

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

	describe('ABAC Managed Room Default Conversion Restrictions', () => {
		const conversionAttrKey = `conversion_test_${Date.now()}`;
		const teamName = `abac-conversion-team-${Date.now()}`;
		let abacRoomId: string;
		let teamIdForConversion: string;
		let teamRoomId: string;

		before('create attribute definition and ABAC-managed private room', async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: conversionAttrKey, values: ['alpha', 'beta'] })
				.expect(200);

			const roomRes = await createRoom({
				type: 'p',
				name: `abac-conversion-room-${Date.now()}`,
			});
			abacRoomId = roomRes.body.group._id;

			await request
				.post(`${v1}/abac/rooms/${abacRoomId}/attributes/${conversionAttrKey}`)
				.set(credentials)
				.send({ values: ['alpha'] })
				.expect(200);
		});

		before('create team, private room inside, add ABAC attribute', async () => {
			// Public team
			const teamRes = await request.post(`${v1}/teams.create`).set(credentials).send({ name: teamName, type: 0 }).expect(200);
			teamIdForConversion = teamRes.body.team._id;

			const teamRoomRes = await createRoom({
				type: 'p',
				name: `abac-team-conversion-room-${Date.now()}`,
				extraData: { teamId: teamIdForConversion },
			});
			teamRoomId = teamRoomRes.body.group._id;

			await request
				.post(`${v1}/abac/rooms/${teamRoomId}/attributes/${conversionAttrKey}`)
				.set(credentials)
				.send({ values: ['beta'] })
				.expect(200);
		});

		after(async () => {
			await Promise.all([deleteTeam(credentials, teamName), deleteRoom({ type: 'p', roomId: abacRoomId })]);
		});

		it('should fail converting ABAC-managed private room into default room', async () => {
			await request
				.post(`${v1}/rooms.saveRoomSettings`)
				.set(credentials)
				.send({ rid: abacRoomId, default: true })
				.expect(400)
				.expect((res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.include('Setting an ABAC managed room as default is not allowed [error-action-not-allowed]');
				});
		});

		it('should fail converting ABAC-managed team room into team default room', async () => {
			await request
				.post(`${v1}/teams.updateRoom`)
				.set(credentials)
				.send({ teamId: teamIdForConversion, roomId: teamRoomId, isDefault: true })
				.expect(400)
				.expect((res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.include('error-room-is-abac-managed');
				});
		});
	});

	describe('Extended Validations & Edge Cases', () => {
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
				.query({ values: 'magenta' })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
				});
		});

		describe('Room attribute bulk operations validations', () => {
			it('POST bulk room attributes should fail when more than 10 distinct attribute keys provided', async () => {
				const tooMany: Record<string, string[]> = {};
				for (let i = 0; i < 11; i++) tooMany[`${bulkAttrPrefix}_${i}`] = ['v1'];
				await request.post(`${v1}/abac/rooms/${testRoom._id}/attributes`).set(credentials).send({ attributes: tooMany }).expect(400);
			});

			it('POST bulk room attributes should fail when one attribute has >10 values', async () => {
				const bigValues = Array.from({ length: 11 }, (_, i) => `v${i}`);
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes`)
					.set(credentials)
					.send({ attributes: { [`${bulkAttrPrefix}_k1`]: bigValues } })
					.expect(400);
			});

			it('POST bulk room attributes should fail when using a value not in attribute definition', async () => {
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes`)
					.set(credentials)
					.send({ attributes: { [secondKey]: ['alpha', 'delta'] } })
					.expect(400);
			});

			it('POST bulk room attributes should succeed when providing valid subset for existing definitions', async () => {
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes`)
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
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: eleven })
					.expect(400);
			});

			it('POST single room attribute should fail when value not allowed by definition', async () => {
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['alpha', 'zzz'] })
					.expect(400);
			});

			it('PUT single room attribute should fail with value not in definition', async () => {
				await request
					.put(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['gamma', 'invalid'] })
					.expect(400);
			});
		});

		describe('Room attribute limits (max 10 attribute keys)', () => {
			const tempAttrKeys: string[] = [];
			it('Reset room attributes before limit test and populate with 10 keys', async () => {
				await request.delete(`${v1}/abac/rooms/${testRoom._id}/attributes`).set(credentials).expect(200);

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
									.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${k}`)
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
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${extraKey}`)
					.set(credentials)
					.send({ values: ['v1'] })
					.expect(400);
			});
		});

		describe('Permission & Auth extended checks', () => {
			it('POST /abac/rooms/:rid/attributes/:key should return 403 for unauthorized user', async () => {
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`)
					.set(unauthorizedCredentials)
					.send({ values: ['alpha'] })
					.expect(403);
			});

			it('PUT /abac/rooms/:rid/attributes/:key should return 403 for unauthorized user', async () => {
				await request
					.put(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`)
					.set(unauthorizedCredentials)
					.send({ values: ['alpha'] })
					.expect(403);
			});

			it('DELETE /abac/rooms/:rid/attributes/:key should return 403 for unauthorized user', async () => {
				await request.delete(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`).set(unauthorizedCredentials).expect(403);
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

			it('POST /abac/rooms/:rid/attributes/:key should fail while disabled', async () => {
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['alpha'] })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('PUT /abac/rooms/:rid/attributes/:key should fail while disabled', async () => {
				await request
					.put(`${v1}/abac/rooms/${testRoom._id}/attributes/${secondKey}`)
					.set(credentials)
					.send({ values: ['alpha'] })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			});

			it('POST /abac/rooms/:rid/attributes (bulk replace) should fail while disabled', async () => {
				await request
					.post(`${v1}/abac/rooms/${testRoom._id}/attributes`)
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

		describe('ABAC Room Type Conversion', () => {
			const attrKey = `type_conversion_${Date.now()}`;

			let roomNoAttr: string;
			let roomWithAttr: string;
			let roomWithAttrAbacDisabled: string;

			before(async () => {
				await updateSetting('ABAC_Enabled', true);

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: attrKey, values: ['val1', 'val2'] })
					.expect(200);

				roomNoAttr = (await createRoom({ type: 'p', name: `abac-type-room-no-attr-${Date.now()}` })).body.group._id;

				roomWithAttr = (await createRoom({ type: 'p', name: `abac-type-room-with-attr-${Date.now()}` })).body.group._id;
				await request
					.post(`${v1}/abac/rooms/${roomWithAttr}/attributes/${attrKey}`)
					.set(credentials)
					.send({ values: ['val1'] })
					.expect(200);

				roomWithAttrAbacDisabled = (await createRoom({ type: 'p', name: `abac-type-room-with-attr-disabled-${Date.now()}` })).body.group
					._id;
				await request
					.post(`${v1}/abac/rooms/${roomWithAttrAbacDisabled}/attributes/${attrKey}`)
					.set(credentials)
					.send({ values: ['val2'] })
					.expect(200);
			});

			after(async () => {
				await updateSetting('ABAC_Enabled', false);
				await Promise.all([
					deleteRoom({ type: 'c', roomId: roomNoAttr }),
					deleteRoom({ type: 'p', roomId: roomWithAttr }),
					deleteRoom({ type: 'c', roomId: roomWithAttrAbacDisabled }),
				]);
			});

			it('should convert private room without ABAC attributes to public', async () => {
				await request
					.post(`${v1}/rooms.saveRoomSettings`)
					.set(credentials)
					.send({ rid: roomNoAttr, roomType: 'c' })
					.expect(200)
					.expect((res) => {
						expect(res.body.success).to.be.true;
					});
			});

			it('should fail converting ABAC managed private room to public', async () => {
				await request
					.post(`${v1}/rooms.saveRoomSettings`)
					.set(credentials)
					.send({ rid: roomWithAttr, roomType: 'c' })
					.expect(400)
					.expect((res) => {
						expect(res.body.success).to.be.false;
						expect(res.body.error).to.include('Changing an ABAC managed private room to public is not allowed');
					});
			});

			it('should allow converting ABAC managed private room to public when ABAC disabled', async () => {
				await updateSetting('ABAC_Enabled', false);

				await request
					.post(`${v1}/rooms.saveRoomSettings`)
					.set(credentials)
					.send({ rid: roomWithAttrAbacDisabled, roomType: 'c' })
					.expect(200)
					.expect((res) => {
						expect(res.body.success).to.be.true;
					});
			});
		});

		describe('ABAC Team Type Conversion', () => {
			const attrKeyTeam = `team_type_conversion_${Date.now()}`;
			const teamNameWithAttr = `abac-team-with-attr-${Date.now()}`;
			const teamNameWithAttrAbacDisabled = `abac-team-with-attr-disabled-${Date.now()}`;

			let teamNameNoAttr: string;
			let mainRoomIdNoAttr: string;
			let mainRoomIdWithAttr: string;
			let mainRoomIdWithAttrAbacDisabled: string;

			before(async () => {
				await updateSetting('ABAC_Enabled', true);

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: attrKeyTeam, values: ['alpha', 'beta'] })
					.expect(200);

				teamNameNoAttr = `abac-team-no-attr-${Date.now()}`;
				const teamNoAttrRes = await request.post(`${v1}/teams.create`).set(credentials).send({ name: teamNameNoAttr, type: 1 }).expect(200);
				mainRoomIdNoAttr = teamNoAttrRes.body.team.roomId;

				const teamWithAttrRes = await request
					.post(`${v1}/teams.create`)
					.set(credentials)
					.send({ name: teamNameWithAttr, type: 1 })
					.expect(200);
				mainRoomIdWithAttr = teamWithAttrRes.body.team.roomId;
				await request
					.post(`${v1}/abac/rooms/${mainRoomIdWithAttr}/attributes/${attrKeyTeam}`)
					.set(credentials)
					.send({ values: ['alpha'] })
					.expect(200);

				const teamWithAttrDisRes = await request
					.post(`${v1}/teams.create`)
					.set(credentials)
					.send({ name: teamNameWithAttrAbacDisabled, type: 1 })
					.expect(200);
				mainRoomIdWithAttrAbacDisabled = teamWithAttrDisRes.body.team.roomId;
				await request
					.post(`${v1}/abac/rooms/${mainRoomIdWithAttrAbacDisabled}/attributes/${attrKeyTeam}`)
					.set(credentials)
					.send({ values: ['beta'] })
					.expect(200);
			});

			after(async () => {
				await updateSetting('ABAC_Enabled', false);
				await Promise.all([
					deleteTeam(credentials, teamNameNoAttr),
					deleteTeam(credentials, teamNameWithAttr),
					deleteTeam(credentials, teamNameWithAttrAbacDisabled),
				]);
			});

			it('should convert private team (main room) without ABAC attributes to public', async () => {
				await request
					.post(`${v1}/rooms.saveRoomSettings`)
					.set(credentials)
					.send({ rid: mainRoomIdNoAttr, roomType: 'c' })
					.expect(200)
					.expect((res) => {
						expect(res.body.success).to.be.true;
					});
			});

			it('should fail converting private team (main room) with ABAC attributes to public', async () => {
				await request
					.post(`${v1}/rooms.saveRoomSettings`)
					.set(credentials)
					.send({ rid: mainRoomIdWithAttr, roomType: 'c' })
					.expect(400)
					.expect((res) => {
						expect(res.body.success).to.be.false;
						// Ideally this should say "Changing an ABAC managed private team to public is not allowed" but the room check is done before the team check
						// And it fails there
						expect(res.body.error).to.include('Changing an ABAC managed private room to public is not allowed');
					});
			});

			it('should allow converting private team (main room) with ABAC attributes to public when ABAC disabled', async () => {
				await updateSetting('ABAC_Enabled', false);

				await request
					.post(`${v1}/rooms.saveRoomSettings`)
					.set(credentials)
					.send({ rid: mainRoomIdWithAttrAbacDisabled, roomType: 'c' })
					.expect(200)
					.expect((res) => {
						expect(res.body.success).to.be.true;
					});
			});
		});

		describe('Invite links & ABAC management', () => {
			const inviteAttrKey = `invite_attr_${Date.now()}`;
			const validateAttrKey = `invite_val_attr_${Date.now()}`;
			let managedRoomId: string;
			let plainRoomId: string;
			let plainRoomInviteToken: string;
			const createdInviteIds: string[] = [];

			before(async () => {
				await updatePermission('create-invite-links', ['admin']);
				await updateSetting('ABAC_Enabled', true);
			});

			it('should create an invite link for a private room without ABAC attributes when ABAC is enabled', async () => {
				const plainRoom = (await createRoom({ type: 'p', name: `invite-plain-${Date.now()}` })).body.group;
				plainRoomId = plainRoom._id;

				await request
					.post(`${v1}/findOrCreateInvite`)
					.set(credentials)
					.send({ rid: plainRoomId, days: 1, maxUses: 0 })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rid', plainRoomId);
						expect(res.body).to.have.property('days', 1);
						expect(res.body).to.have.property('maxUses', 0);
						plainRoomInviteToken = res.body._id;
						createdInviteIds.push(plainRoomInviteToken);
					});
			});

			it('validateInviteToken should return valid=true for token from non-ABAC managed room', async () => {
				await request
					.post(`${v1}/validateInviteToken`)
					.send({ token: plainRoomInviteToken })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('valid', true);
					});
			});

			it('validateInviteToken should return valid=false for random invalid token', async () => {
				await request
					.post(`${v1}/validateInviteToken`)
					.send({ token: 'invalid123' })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('valid', false);
					});
			});

			it('validateInviteToken should return valid=false after room becomes ABAC managed', async () => {
				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: validateAttrKey, values: ['one'] })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [{ key: validateAttrKey, values: ['one'] }]);

				await request
					.post(`${v1}/abac/rooms/${plainRoomId}/attributes/${validateAttrKey}`)
					.set(credentials)
					.send({ values: ['one'] })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				await request
					.post(`${v1}/validateInviteToken`)
					.send({ token: plainRoomInviteToken })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('valid', false);
					});
			});

			it('validateInviteToken should return valid=true again after disabling ABAC', async () => {
				await updateSetting('ABAC_Enabled', false);

				await request
					.post(`${v1}/validateInviteToken`)
					.send({ token: plainRoomInviteToken })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('valid', true);
					});

				await updateSetting('ABAC_Enabled', true);
			});

			it('should fail creating an invite link for an ABAC managed room while ABAC is enabled', async () => {
				const managedRoom = (await createRoom({ type: 'p', name: `invite-managed-${Date.now()}` })).body.group;
				managedRoomId = managedRoom._id;

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: inviteAttrKey, values: ['one'] })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [{ key: inviteAttrKey, values: ['one'] }]);

				await request
					.post(`${v1}/abac/rooms/${managedRoomId}/attributes/${inviteAttrKey}`)
					.set(credentials)
					.send({ values: ['one'] })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				await request
					.post(`${v1}/findOrCreateInvite`)
					.set(credentials)
					.send({ rid: managedRoomId, days: 1, maxUses: 0 })
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-invalid-room');
						expect(res.body).to.have.property('error').that.includes('Room is ABAC managed');
					});
			});

			it('should allow creating an invite link for previously ABAC managed room after disabling ABAC', async () => {
				await updateSetting('ABAC_Enabled', false);

				await request
					.post(`${v1}/findOrCreateInvite`)
					.set(credentials)
					.send({ rid: managedRoomId, days: 1, maxUses: 0 })
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rid', managedRoomId);
						createdInviteIds.push(res.body._id);
					});
			});

			after(async () => {
				await Promise.all(createdInviteIds.map((id) => request.delete(`${v1}/removeInvite/${id}`).set(credentials)));
			});
		});
	});

	describe('Room access (invite, addition)', () => {
		let roomWithoutAttr: IRoom;
		let roomWithAttr: IRoom;
		const accessAttrKey = `access_attr_${Date.now()}`;

		before(async () => {
			await updateSetting('ABAC_Enabled', true);

			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: accessAttrKey, values: ['v1'] })
				.expect(200);

			// We have to add them directly cause otherwise the abac engine would kick the user from the room after the attribute is added
			await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [{ key: accessAttrKey, values: ['v1'] }]);

			// Create two private rooms: one will stay without attributes, the other will get the attribute
			roomWithoutAttr = (await createRoom({ type: 'p', name: `abac-access-noattr-${Date.now()}` })).body.group;
			roomWithAttr = (await createRoom({ type: 'p', name: `abac-access-withattr-${Date.now()}` })).body.group;

			// Assign the attribute to the second room
			await request
				.post(`${v1}/abac/rooms/${roomWithAttr._id}/attributes/${accessAttrKey}`)
				.set(credentials)
				.send({ values: ['v1'] })
				.expect(200);
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId: roomWithoutAttr._id });
			await deleteRoom({ type: 'p', roomId: roomWithAttr._id });
		});

		it('INVITE: user without attributes invited to room without attributes succeeds', async () => {
			await request
				.post(`${v1}/groups.invite`)
				.set(credentials)
				.send({ roomId: roomWithoutAttr._id, usernames: [unauthorizedUser.username] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('INVITE: user without attributes invited to room with attributes should fail', async () => {
			await request
				.post(`${v1}/groups.invite`)
				.set(credentials)
				.send({ roomId: roomWithAttr._id, usernames: [unauthorizedUser.username] })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').that.includes('error-usernames-not-matching-abac-attributes');
				});
		});

		it('INVITE: after room loses attributes user without attributes can be invited', async () => {
			await request.delete(`${v1}/abac/rooms/${roomWithAttr._id}/attributes/${accessAttrKey}`).set(credentials).expect(200);

			// Try inviting again - should now succeed
			await request
				.post(`${v1}/groups.invite`)
				.set(credentials)
				.send({ roomId: roomWithAttr._id, usernames: [unauthorizedUser.username] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});
});
