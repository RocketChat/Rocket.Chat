import type { Credentials } from '@rocket.chat/api-client';
import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { getCredentials, request, credentials, methodCall } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
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

		it('POST should allow more than 10 values for an attribute definition', async () => {
			const manyValues = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v11', 'v12'];

			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: `${anotherKey}_many_values`, values: manyValues })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(`${v1}/abac/attributes`)
				.set(credentials)
				.query({ key: `${anotherKey}_many_values` })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('attributes').that.is.an('array');
					const found = res.body.attributes.find((a: any) => a.key === `${anotherKey}_many_values`);
					expect(found).to.exist;
					expect(found).to.have.property('values').that.deep.equals(manyValues);
				});
		});

		it('POST should fail creating duplicate key', async () => {
			await request.get(`${v1}/abac/attributes`).set(credentials).expect(200);
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

		it('PUT should allow updating an attribute definition to have more than 10 values', async () => {
			const manyValues = ['cyan', 'magenta', 'yellow', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10', 'w11', 'w12'];

			await request
				.put(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.send({ values: manyValues })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(`${v1}/abac/attributes/${attributeId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.values).to.deep.equal(manyValues);
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

		it('PUT should update key only (key-updated)', async () => {
			const testKey = `${initialKey}_update_test`;
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: testKey, values: ['val1', 'val2'] })
				.expect(200);

			const listRes = await request.get(`${v1}/abac/attributes`).query({ key: testKey }).set(credentials).expect(200);

			const attr = listRes.body.attributes.find((a: any) => a.key === testKey);
			expect(attr).to.exist;
			const attrId = attr._id;

			const newKey = `${initialKey}_update_test_renamed`;
			await request
				.put(`${v1}/abac/attributes/${attrId}`)
				.set(credentials)
				.send({ key: newKey })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(`${v1}/abac/attributes/${attrId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('key', newKey);
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

		it('POST room attribute should add values and reflect inUse=true', async () => {
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
		});

		it('should throw an error when trying to audit the messages of an abac managed room', async () => {
			await request
				.post(methodCall('auditGetMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'auditGetMessages',
						params: [
							{
								type: '',
								msg: 'test1234',
								startDate: { $date: new Date() },
								endDate: { $date: new Date() },
								rid: testRoom._id,
								users: [],
							},
						],
						id: '14',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res) => {
					const result = JSON.parse(res.body.message);
					expect(result).to.have.property('error');
					expect(result.error).to.have.property('error', `Room doesn't exist`);
				});
		});

		describe('Audit messages by user and ABAC-managed rooms', () => {
			let auditUser: IUser;
			let auditUserCreds: Credentials;
			let auditRoom: IRoom;
			const auditAttrKey = `audit_attr_${Date.now()}`;
			let startDate: Date;
			let endDate: Date;

			before(async () => {
				startDate = new Date();
				endDate = new Date(startDate.getTime() + 1000 * 60);

				auditUser = await createUser();
				auditUserCreds = await login(auditUser.username, password);

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: auditAttrKey, values: ['v1'] })
					.expect(200);

				await addAbacAttributesToUserDirectly(auditUser._id, [{ key: auditAttrKey, values: ['v1'] }]);
				await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [{ key: auditAttrKey, values: ['v1'] }]);

				const roomRes = await createRoom({ type: 'p', name: `abac-audit-user-room-${Date.now()}`, members: [auditUser.username!] });
				auditRoom = roomRes.body.group as IRoom;

				await request
					.post(`${v1}/abac/rooms/${auditRoom._id}/attributes/${auditAttrKey}`)
					.set(credentials)
					.send({ values: ['v1'] })
					.expect(200);
			});

			after(async () => {
				await deleteRoom({ type: 'p', roomId: auditRoom._id });
				await deleteUser(auditUser);
			});

			it("should return no messages when auditing a user that's part of an ABAC-managed room", async () => {
				await request
					.post(`${v1}/chat.sendMessage`)
					.set(auditUserCreds)
					.send({ message: { rid: auditRoom._id, msg: 'audit message in abac room' } })
					.expect(200);

				await request
					.post(methodCall('auditGetMessages'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'auditGetMessages',
							params: [
								{
									type: 'u',
									msg: 'audit message in abac room',
									startDate: { $date: startDate },
									endDate: { $date: endDate },
									rid: '',
									users: [auditUser.username],
									visitor: '',
									agent: '',
								},
							],
							id: 'abac-audit-1',
							msg: 'method',
						}),
					})
					.expect(200)
					.expect((res) => {
						const parsed = JSON.parse(res.body.message);
						expect(parsed).to.have.property('result');
						expect(parsed.result).to.be.an('array').that.is.empty;
					});
			});

			it('should return no messages when auditing a user that WAS part of an ABAC-managed room', async () => {
				await request
					.post(`${v1}/chat.sendMessage`)
					.set(auditUserCreds)
					.send({ message: { rid: auditRoom._id, msg: 'audit message before removal' } })
					.expect(200);

				await request.post(`${v1}/groups.kick`).set(credentials).send({ roomId: auditRoom._id, username: auditUser.username }).expect(200);

				await request
					.post(methodCall('auditGetMessages'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'auditGetMessages',
							params: [
								{
									type: 'u',
									msg: 'audit message before removal',
									startDate: { $date: startDate },
									endDate: { $date: endDate },
									rid: '',
									users: [auditUser.username],
									visitor: '',
									agent: '',
								},
							],
							id: 'abac-audit-2',
							msg: 'method',
						}),
					})
					.expect(200)
					.expect((res) => {
						const parsed = JSON.parse(res.body.message);
						expect(parsed).to.have.property('result');
						expect(parsed.result).to.be.an('array').that.is.empty;
					});
			});

			it("should return messages when auditing a user that is part of a room that's no longer ABAC-managed", async () => {
				await request
					.post(`${v1}/groups.invite`)
					.set(credentials)
					.send({ roomId: auditRoom._id, usernames: [auditUser.username] })
					.expect(200);

				await request.delete(`${v1}/abac/rooms/${auditRoom._id}/attributes/${auditAttrKey}`).set(credentials).expect(200);

				await request
					.post(`${v1}/chat.sendMessage`)
					.set(auditUserCreds)
					.send({ message: { rid: auditRoom._id, msg: 'audit message after room no longer abac' } })
					.expect(200);

				await request
					.post(methodCall('auditGetMessages'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'auditGetMessages',
							params: [
								{
									type: 'u',
									msg: 'audit message after room no longer abac',
									startDate: { $date: startDate },
									endDate: { $date: endDate },
									rid: '',
									users: [auditUser.username],
									visitor: '',
									agent: '',
								},
							],
							id: 'abac-audit-3',
							msg: 'method',
						}),
					})
					.expect(200)
					.expect((res) => {
						const parsed = JSON.parse(res.body.message);
						expect(parsed).to.have.property('result');
						expect(parsed.result).to.be.an('array').with.lengthOf.greaterThan(0);
					});
			});
		});

		it('PUT room attribute should replace values and keep inUse=true', async () => {
			await request
				.put(`${v1}/abac/rooms/${testRoom._id}/attributes/${updatedKey}`)
				.set(credentials)
				.send({ values: ['magenta', 'yellow'] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
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

		describe('DELETE room attribute key (dedicated room)', () => {
			let dedicatedRoom: IRoom;

			before(async () => {
				dedicatedRoom = (await createRoom({ type: 'p', name: `abac-dedicated-${Date.now()}` })).body.group;
			});

			after(async () => {
				await deleteRoom({ type: 'p', roomId: dedicatedRoom._id });
			});

			it('should succeed and remove only the specified key (key-removed)', async () => {
				const key1 = `${initialKey}_room1`;
				const key2 = `${initialKey}_room2`;

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: key1, values: ['value1'] })
					.expect(200);

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: key2, values: ['value2'] })
					.expect(200);

				await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [
					{ key: key1, values: ['value1'] },
					{ key: key2, values: ['value2'] },
				]);

				await request
					.post(`${v1}/abac/rooms/${dedicatedRoom._id}/attributes`)
					.set(credentials)
					.send({ attributes: { [key1]: ['value1'], [key2]: ['value2'] } })
					.expect(200);

				await request
					.delete(`${v1}/abac/rooms/${dedicatedRoom._id}/attributes/${key1}`)
					.set(credentials)
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				const roomRes = await request.get(`${v1}/rooms.info?roomId=${dedicatedRoom._id}`).set(credentials);
				expect(roomRes.status).to.equal(200);
				const abacAttrs = roomRes.body.room?.abacAttributes || [];
				expect(abacAttrs).to.be.an('array').that.has.lengthOf(1);
				expect(abacAttrs[0]).to.have.property('key', key2);
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

		it('DELETE attribute definition should remove the key (key-removed)', async () => {
			const testKey = `${initialKey}_delete_test`;
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: testKey, values: ['del1', 'del2'] })
				.expect(200);

			const listRes = await request.get(`${v1}/abac/attributes`).query({ key: testKey }).set(credentials).expect(200);

			const attr = listRes.body.attributes.find((a: any) => a.key === testKey);
			expect(attr).to.exist;
			const attrId = attr._id;

			await request
				.delete(`${v1}/abac/attributes/${attrId}`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(`${v1}/abac/attributes/${attrId}`)
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('error', 'error-attribute-not-found');
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

				await deleteRoom({ type: 'p', roomId: plainRoomId });
				await deleteRoom({ type: 'p', roomId: managedRoomId });
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
					expect(res.body).to.have.property('errorType', 'error-only-compliant-users-can-be-added-to-abac-rooms');
				});
		});

		it('INVITE: after room loses attributes user without attributes can be invited', async () => {
			await request.delete(`${v1}/abac/rooms/${roomWithAttr._id}/attributes/${accessAttrKey}`).set(credentials).expect(200);

			await request
				.post(`${v1}/groups.invite`)
				.set(credentials)
				.send({ roomId: roomWithAttr._id, usernames: [unauthorizedUser.username] })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		describe('ABAC disabled with ABAC-managed room', () => {
			let enabledAccessAttrKey: string;
			let enabledUser: IUser;
			let managedRoom: IRoom;

			before(async () => {
				enabledAccessAttrKey = `${accessAttrKey}_disabled_case`;

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: enabledAccessAttrKey, values: ['v1'] })
					.expect(200);

				await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [{ key: enabledAccessAttrKey, values: ['v1'] }]);

				managedRoom = (await createRoom({ type: 'p', name: `abac-access-disabled-${Date.now()}` })).body.group;

				await request
					.post(`${v1}/abac/rooms/${managedRoom._id}/attributes/${enabledAccessAttrKey}`)
					.set(credentials)
					.send({ values: ['v1'] })
					.expect(200);

				const username = `abac-enabled-user-${Date.now()}`;
				const createUserRes = await request
					.post(`${v1}/users.create`)
					.set(credentials)
					.send({
						email: `${username}@example.com`,
						name: username,
						username,
						password: 'pass@123',
					})
					.expect(200);

				enabledUser = createUserRes.body.user;
				await addAbacAttributesToUserDirectly(enabledUser._id, [{ key: enabledAccessAttrKey, values: ['v1'] }]);

				await updateSetting('ABAC_Enabled', false);
			});

			after(async () => {
				await updateSetting('ABAC_Enabled', true);

				await deleteRoom({ type: 'p', roomId: managedRoom._id });
				await deleteUser(enabledUser);
			});

			it('INVITE: should fail adding user to ABAC-managed private room when ABAC is disabled', async () => {
				await request
					.post(`${v1}/groups.invite`)
					.set(credentials)
					.send({ roomId: managedRoom._id, usernames: [enabledUser.username] })
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-room-is-abac-managed');
					});
			});

			it('INVITE: should still fail after user loses attributes when ABAC is disabled', async () => {
				await addAbacAttributesToUserDirectly(enabledUser._id, [{ key: enabledAccessAttrKey, values: [] }]);

				await request
					.post(`${v1}/groups.invite`)
					.set(credentials)
					.send({ roomId: managedRoom._id, usernames: [enabledUser.username] })
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-room-is-abac-managed');
					});
			});
		});
	});

	describe('Room access (after subscribed)', () => {
		let cacheRoom: IRoom;
		const cacheAttrKey = `access_cache_attr_${Date.now()}`;
		let cacheUser: IUser;
		let cacheUserCreds: Credentials;
		const ttlSeconds = 5;

		before(async function () {
			this.timeout(10000);

			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: cacheAttrKey, values: ['on'] })
				.expect(200);

			cacheRoom = (await createRoom({ type: 'p', name: `abac-cache-room-${Date.now()}` })).body.group;

			cacheUser = await createUser();
			cacheUserCreds = await login(cacheUser.username, password);
			await addAbacAttributesToUserDirectly(cacheUser._id, [{ key: cacheAttrKey, values: ['on'] }]);
			await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [{ key: cacheAttrKey, values: ['on'] }]);

			await request
				.post(`${v1}/abac/rooms/${cacheRoom._id}/attributes/${cacheAttrKey}`)
				.set(credentials)
				.send({ values: ['on'] })
				.expect(200);

			await request
				.post(`${v1}/groups.invite`)
				.set(credentials)
				.send({ roomId: cacheRoom._id, usernames: [cacheUser.username] })
				.expect(200);

			await updateSetting('Abac_Cache_Decision_Time_Seconds', ttlSeconds);

			await request
				.post(`${v1}/chat.sendMessage`)
				.set(credentials)
				.send({ message: { rid: cacheRoom._id, msg: 'Seed message for cache access test' } })
				.expect(200);
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId: cacheRoom._id });
			await deleteUser(cacheUser);
			await updateSetting('Abac_Cache_Decision_Time_Seconds', 300);
		});

		it('ACCESS: user can retrieve messages after subscription (initial compliant)', async () => {
			await request
				.get(`/api/v1/groups.history`)
				.set(cacheUserCreds)
				.query({ roomId: cacheRoom._id })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').that.is.an('array');
				});
		});

		it('ACCESS: user retains access within cache after losing attributes', async () => {
			await addAbacAttributesToUserDirectly(cacheUser._id, []);

			await request
				.get(`/api/v1/groups.history`)
				.set(cacheUserCreds)
				.query({ roomId: cacheRoom._id })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('ACCESS: user loses access after cache expiry', async () => {
			await updateSetting('Abac_Cache_Decision_Time_Seconds', 0);

			await request
				.get(`${v1}/groups.history`)
				.set(cacheUserCreds)
				.query({ roomId: cacheRoom._id })
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('ACCESS: user is removed from the room when the access check fails', async () => {
			const roomInfoRes = await request
				.get(`${v1}/rooms.membersOrderedByRole`)
				.set(credentials)
				.query({ roomId: cacheRoom._id })
				.expect(200);
			const { members } = roomInfoRes.body;

			expect(members.find((m: IUser) => m.username === cacheUser.username)).to.be.undefined;
		});

		it('ACCESS: user can be re invited to the room and access history', async () => {
			await addAbacAttributesToUserDirectly(cacheUser._id, [{ key: cacheAttrKey, values: ['on'] }]);
			await request
				.post(`${v1}/groups.invite`)
				.set(credentials)
				.send({ roomId: cacheRoom._id, usernames: [cacheUser.username] })
				.expect(200);

			await request
				.get(`/api/v1/groups.history`)
				.set(cacheUserCreds)
				.query({ roomId: cacheRoom._id })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('ACCESS: keeps access once room attributes are removed', async () => {
			await request.delete(`${v1}/abac/rooms/${cacheRoom._id}/attributes/${cacheAttrKey}`).set(credentials).expect(200);

			await request
				.get(`${v1}/groups.history`)
				.set(cacheUserCreds)
				.query({ roomId: cacheRoom._id })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});

	describe('list abac rooms', () => {
		const listAttrKey1 = `list_attr_1_${Date.now()}`;
		const listAttrKey2 = `list_attr_2_${Date.now()}`;
		const listRoomName1 = `abac-list-room-1-${Date.now()}`;
		const listRoomName2 = `abac-list-room-2-${Date.now()}`;
		const listRoomNoAttrName = `abac-list-room-noattr-${Date.now()}`;

		let listRoomId1: string;
		let listRoomId2: string;
		let listRoomNoAttrId: string;

		before('ensure ABAC enabled and create attribute definitions & rooms', async () => {
			await updateSetting('ABAC_Enabled', true);

			// Create attribute definitions
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: listAttrKey1, values: ['alpha', 'beta'] })
				.expect(200);
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: listAttrKey2, values: ['x', 'y'] })
				.expect(200);

			// Create private rooms
			listRoomId1 = (await createRoom({ type: 'p', name: listRoomName1 })).body.group._id;
			listRoomId2 = (await createRoom({ type: 'p', name: listRoomName2 })).body.group._id;
			listRoomNoAttrId = (await createRoom({ type: 'p', name: listRoomNoAttrName })).body.group._id;

			// Assign attributes to first two rooms
			await request
				.post(`${v1}/abac/rooms/${listRoomId1}/attributes/${listAttrKey1}`)
				.set(credentials)
				.send({ values: ['alpha'] })
				.expect(200);
			await request
				.post(`${v1}/abac/rooms/${listRoomId2}/attributes/${listAttrKey2}`)
				.set(credentials)
				.send({ values: ['x'] })
				.expect(200);
		});

		after(async () => {
			await Promise.all([
				deleteRoom({ type: 'p', roomId: listRoomId1 }),
				deleteRoom({ type: 'p', roomId: listRoomId2 }),
				deleteRoom({ type: 'p', roomId: listRoomNoAttrId }),
			]);
		});

		it('should list only private rooms with ABAC attributes (baseline)', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms').that.is.an('array');
					const ids = res.body.rooms.map((r: any) => r._id);
					expect(ids).to.include(listRoomId1);
					expect(ids).to.include(listRoomId2);
					expect(ids).to.not.include(listRoomNoAttrId);
				});
		});

		it('should NOT list a newly created private room without attributes', async () => {
			const tempNoAttrRoomId = (await createRoom({ type: 'p', name: `abac-list-temp-noattr-${Date.now()}` })).body.group._id;
			const res = await request.get(`${v1}/abac/rooms`).set(credentials).expect(200);
			const ids = res.body.rooms.map((r: any) => r._id);
			expect(ids).to.not.include(tempNoAttrRoomId);
			await deleteRoom({ type: 'p', roomId: tempNoAttrRoomId });
		});

		it('should NOT list a public room (cannot be ABAC managed)', async () => {
			const publicRoomId = (await createRoom({ type: 'c', name: `abac-list-public-${Date.now()}` })).body.channel._id;
			const res = await request.get(`${v1}/abac/rooms`).set(credentials).expect(200);
			const ids = res.body.rooms.map((r: any) => r._id);
			expect(ids).to.not.include(publicRoomId);
			await deleteRoom({ type: 'c', roomId: publicRoomId });
		});

		it('should NOT list a team private room without attributes', async () => {
			// Create a private team and a private room inside it (not main room)
			const teamRes = await request
				.post(`${v1}/teams.create`)
				.set(credentials)
				.send({ name: `abac-list-team-noattr-${Date.now()}`, type: 0 })
				.expect(200);
			const teamIdLocal = teamRes.body.team._id;
			const teamRoomRes = await createRoom({ type: 'p', name: `abac-list-team-room-${Date.now()}`, extraData: { teamId: teamIdLocal } });
			const teamPrivateRoomId = teamRoomRes.body.group._id;
			const res = await request.get(`${v1}/abac/rooms`).set(credentials).expect(200);
			const ids = res.body.rooms.map((r: any) => r._id);
			expect(ids).to.not.include(teamPrivateRoomId);
			await deleteRoom({ type: 'p', roomId: teamPrivateRoomId });
			await deleteTeam(credentials, teamRes.body.team.name);
		});

		it('should stop listing a room after its ABAC attributes are removed', async () => {
			// Ensure room 1 currently listed
			const resBefore = await request.get(`${v1}/abac/rooms`).set(credentials).expect(200);
			const idsBefore = resBefore.body.rooms.map((r: any) => r._id);
			expect(idsBefore).to.include(listRoomId1);

			// Remove its only attribute key (listAttrKey1) - value was 'alpha'
			await request.delete(`${v1}/abac/rooms/${listRoomId1}/attributes/${listAttrKey1}`).set(credentials).expect(200);

			const resAfter = await request.get(`${v1}/abac/rooms`).set(credentials).expect(200);
			const idsAfter = resAfter.body.rooms.map((r: any) => r._id);
			expect(idsAfter).to.not.include(listRoomId1);

			// Re-add attribute so other tests relying on it remain stable
			await request
				.post(`${v1}/abac/rooms/${listRoomId1}/attributes/${listAttrKey1}`)
				.set(credentials)
				.send({ values: ['alpha'] })
				.expect(200);
		});

		it('should NOT list a default private room even if attempt to add attribute fails', async () => {
			const defaultRoomId = (await createRoom({ type: 'p', name: `abac-list-default-${Date.now()}` })).body.group._id;
			await request.post(`${v1}/rooms.saveRoomSettings`).set(credentials).send({ rid: defaultRoomId, default: true }).expect(200);
			const defKey = `list_def_attr_${Date.now()}`;
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: defKey, values: ['one'] })
				.expect(200);
			await request
				.post(`${v1}/abac/rooms/${defaultRoomId}/attributes/${defKey}`)
				.set(credentials)
				.send({ values: ['one'] })
				.expect(400);
			const res = await request.get(`${v1}/abac/rooms`).set(credentials).expect(200);
			const ids = res.body.rooms.map((r: any) => r._id);
			expect(ids).to.not.include(defaultRoomId);
			await request.post(`${v1}/rooms.saveRoomSettings`).set(credentials).send({ rid: defaultRoomId, default: false }).expect(200);
			await deleteRoom({ type: 'p', roomId: defaultRoomId });
		});

		it('should filter by room name (filterType=roomName)', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.query({ filter: 'abac-list-room-1', filterType: 'roomName' })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
					const ids = res.body.rooms.map((r: any) => r._id);
					expect(ids).to.include(listRoomId1);
					expect(ids).to.not.include(listRoomId2);
				});
		});

		it('should filter by attribute key (filterType=attribute)', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.query({ filter: listAttrKey2, filterType: 'attribute' })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
					const ids = res.body.rooms.map((r: any) => r._id);
					expect(ids).to.include(listRoomId2);
					expect(ids).to.not.include(listRoomId1);
				});
		});

		it('should filter by attribute value (filterType=value)', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.query({ filter: 'alpha', filterType: 'value' })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
					const ids = res.body.rooms.map((r: any) => r._id);
					expect(ids).to.include(listRoomId1);
					expect(ids).to.not.include(listRoomId2);
				});
		});

		it('should match across name, key and values when filterType=all (default)', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.query({ filter: 'x', filterType: 'all' })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
					const ids = res.body.rooms.map((r: any) => r._id);
					expect(ids).to.include(listRoomId2);
					expect(ids).to.not.include(listRoomId1);
				});
		});

		it('should paginate results (count=1 offset=0)', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.query({ count: 1, offset: 0 })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('count', 1);
					expect(res.body.rooms).to.have.lengthOf(1);
				});
		});

		it('should paginate results (count=1 offset=1)', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.query({ count: 1, offset: 1 })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
					expect(res.body).to.have.property('offset', 1);
					expect(res.body).to.have.property('count').that.is.at.most(1);
					expect(res.body.rooms).to.have.length.at.most(1);
				});
		});

		it('should return empty list when filter does not match anything', async () => {
			await request
				.get(`${v1}/abac/rooms`)
				.set(credentials)
				.query({ filter: 'nonexistent-filter-xyz', filterType: 'roomName' })
				.expect(200)
				.expect((res) => {
					expect(res.body.success).to.be.true;
					expect(res.body.rooms).to.be.an('array').with.lengthOf(0);
				});
		});

		it('should reject unauthorized user (403)', async () => {
			await request.get(`${v1}/abac/rooms`).set(unauthorizedCredentials).expect(403);
		});

		describe('ABAC managed private team main rooms listing', () => {
			const teamListAttrKey = `team_list_attr_${Date.now()}`;
			const teamListName = `abac-list-team-${Date.now()}`;
			let teamListMainRoomId: string;

			before('create private team (no attributes yet) and attribute definition', async () => {
				const teamRes = await request.post(`${v1}/teams.create`).set(credentials).send({ name: teamListName, type: 1 }).expect(200);

				teamListMainRoomId = teamRes.body.team.roomId;

				await request
					.post(`${v1}/abac/attributes`)
					.set(credentials)
					.send({ key: teamListAttrKey, values: ['red', 'blue'] })
					.expect(200);
			});

			it('baseline: team main private room without attributes should NOT appear in /abac/rooms list', async () => {
				await request
					.get(`${v1}/abac/rooms`)
					.set(credentials)
					.expect(200)
					.expect((res) => {
						const ids = res.body.rooms.map((r: any) => r._id);
						expect(ids).to.not.include(teamListMainRoomId);
					});
			});

			it('after adding ABAC attribute to team main room it SHOULD appear in /abac/rooms list', async () => {
				await request
					.post(`${v1}/abac/rooms/${teamListMainRoomId}/attributes/${teamListAttrKey}`)
					.set(credentials)
					.send({ values: ['red'] })
					.expect(200);

				await request
					.get(`${v1}/abac/rooms`)
					.set(credentials)
					.expect(200)
					.expect((res) => {
						const ids = res.body.rooms.map((r: any) => r._id);
						expect(ids).to.include(teamListMainRoomId);
					});
			});

			it('filterType=attribute should return team main room when filtering by its attribute key', async () => {
				await request
					.get(`${v1}/abac/rooms`)
					.set(credentials)
					.query({ filter: teamListAttrKey, filterType: 'attribute' })
					.expect(200)
					.expect((res) => {
						const ids = res.body.rooms.map((r: any) => r._id);
						expect(ids).to.include(teamListMainRoomId);
					});
			});

			it('filterType=value should return team main room when filtering by an assigned attribute value', async () => {
				await request
					.get(`${v1}/abac/rooms`)
					.set(credentials)
					.query({ filter: 'red', filterType: 'value' })
					.expect(200)
					.expect((res) => {
						const ids = res.body.rooms.map((r: any) => r._id);
						expect(ids).to.include(teamListMainRoomId);
					});
			});

			it('filterType=value should NOT return team main room when filtering by a non-existent value', async () => {
				await request
					.get(`${v1}/abac/rooms`)
					.set(credentials)
					.query({ filter: 'nonexistent-team-value', filterType: 'value' })
					.expect(200)
					.expect((res) => {
						const ids = res.body.rooms.map((r: any) => r._id);
						expect(ids).to.not.include(teamListMainRoomId);
					});
			});

			it('pagination should include team main room on a page where it falls (count=1 offset varies)', async () => {
				// Get full list to determine index
				const fullRes = await request.get(`${v1}/abac/rooms`).set(credentials).expect(200);
				const allIds: string[] = fullRes.body.rooms.map((r: any) => r._id);
				const index = allIds.indexOf(teamListMainRoomId);
				expect(index).to.not.equal(-1);

				// Request the page containing the team main room
				const pageRes = await request.get(`${v1}/abac/rooms`).set(credentials).query({ count: 1, offset: index }).expect(200);
				expect(pageRes.body.rooms.map((r: any) => r._id)).to.include(teamListMainRoomId);
			});

			after(async () => {
				await deleteTeam(credentials, teamListName);
			});
		});
	});

	describe('LDAP integration', () => {
		before(async () => {
			await Promise.all([
				updateSetting('LDAP_Enable', true),
				updateSetting('ABAC_Enabled', true),
				updateSetting('LDAP_Background_Sync', true),
				updateSetting('LDAP_Background_Sync_Import_New_Users', true),
				updateSetting('LDAP_Host', 'openldap'),
				updateSetting('LDAP_Port', 1389),
				updateSetting('LDAP_Authentication', true),
				updateSetting('LDAP_Authentication_UserDN', 'cn=admin,dc=space,dc=air'),
				updateSetting('LDAP_Authentication_Password', 'adminpassword'),
				updateSetting('LDAP_BaseDN', 'ou=users,dc=space,dc=air'),
				updateSetting('LDAP_AD_User_Search_Field', 'uid'),
				updateSetting('LDAP_AD_Username_Field', 'uid'),
				updateSetting('LDAP_Background_Sync_ABAC_Attributes', true),
				updateSetting('LDAP_Background_Sync_ABAC_Attributes_Interval', '0 0 * * *'),
				updateSetting(
					'LDAP_ABAC_AttributeMap',
					JSON.stringify({
						departmentNumber: 'department',
						telephoneNumber: 'phone',
					}),
				),
			]);
		});

		before(async function () {
			this.timeout(10000);
			// Wait for background sync to run once before tests start
			await request.post(`${v1}/ldap.syncNow`).set(credentials);
			await sleep(5000);

			// Force abac attribute sync for user john.young, that way we test it too :p
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({ emails: ['john.young@space.air'] });

			await sleep(2000);
		});

		it('should sync LDAP user john.young with mapped ABAC attributes', async () => {
			const res = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'john.young' }).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('user');
			const user = res.body.user as IUser;

			expect(user).to.have.property('abacAttributes');
			expect(user.abacAttributes).to.be.an('array');

			const departmentAttr = user?.abacAttributes?.find((attr: IAbacAttributeDefinition) => attr.key === 'department');

			expect(departmentAttr).to.exist;
			expect(departmentAttr?.values || []).to.be.an('array').that.is.not.empty;
		});

		it('should sync ABAC attributes for SOME users via /abac/users/sync', async () => {
			// Users already imported from LDAP, but without ABAC attributes.
			// We now sync only SOME users, identified by their emails.
			const resAlan = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'alan.bean' }).expect(200);
			const resBuzz = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'buzz.aldrin' }).expect(200);

			const alanBefore = resAlan.body.user as IUser;
			const buzzBefore = resBuzz.body.user as IUser;

			// Ensure they start without ABAC attributes (or with an empty array)
			expect(alanBefore).to.have.property('username', 'alan.bean');
			const alanBeforeAttrs = alanBefore.abacAttributes || [];
			expect(alanBeforeAttrs).to.be.an('array').that.has.lengthOf(0);

			expect(buzzBefore).to.have.property('username', 'buzz.aldrin');
			const buzzBeforeAttrs = buzzBefore.abacAttributes || [];
			expect(buzzBeforeAttrs).to.be.an('array').that.has.lengthOf(0);

			// Sync SOME users by email
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({
					emails: ['alan.bean@space.air', 'buzz.aldrin@space.air'],
				})
				.expect(200);

			const resAlanAfter = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'alan.bean' }).expect(200);
			const resBuzzAfter = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'buzz.aldrin' }).expect(200);

			const alanAfter = resAlanAfter.body.user as IUser;
			const buzzAfter = resBuzzAfter.body.user as IUser;

			const alanAfterAttrs = alanAfter.abacAttributes || [];
			const buzzAfterAttrs = buzzAfter.abacAttributes || [];

			expect(alanAfterAttrs).to.be.an('array').that.is.not.empty;
			expect(buzzAfterAttrs).to.be.an('array').that.is.not.empty;

			const alanDept = alanAfterAttrs.find((attr: IAbacAttributeDefinition) => attr.key === 'department');
			const buzzDept = buzzAfterAttrs.find((attr: IAbacAttributeDefinition) => attr.key === 'department');

			expect(alanDept).to.exist;
			expect(alanDept?.values || []).to.be.an('array').that.is.not.empty;

			expect(buzzDept).to.exist;
			expect(buzzDept?.values || []).to.be.an('array').that.is.not.empty;
		});

		it('should support /abac/users/sync with usernames as param', async () => {
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({
					usernames: ['david.scott', 'gene.cernan'],
				})
				.expect(200);

			const usersToCheck = ['david.scott', 'gene.cernan'];

			const results = await Promise.all(
				usersToCheck.map(async (username) => {
					const res = await request.get(`${v1}/users.info`).set(credentials).query({ username }).expect(200);
					return res.body.user as IUser;
				}),
			);

			for (const user of results) {
				const attrs = user.abacAttributes || [];
				expect(attrs).to.be.an('array').that.is.not.empty;

				const dept = attrs.find((attr: IAbacAttributeDefinition) => attr.key === 'department');
				expect(dept).to.exist;
				expect(dept?.values || []).to.be.an('array').that.is.not.empty;
			}
		});

		// Hard limits for the endpoint - max 100 identifiers per type, 400 total per request
		it('should fail /abac/users/sync when more than 100 usernames are provided', async () => {
			const usernames = Array.from({ length: 101 }, (_, i) => `user_${i}@example.com`);
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({
					usernames,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should fail /abac/users/sync when more than 100 ids are provided', async () => {
			const ids = Array.from({ length: 101 }, (_, i) => `id_${i}`);
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({
					ids,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should fail /abac/users/sync when more than 100 emails are provided', async () => {
			const emails = Array.from({ length: 101 }, (_, i) => `user_${i}@example.com`);
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({
					emails,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should fail /abac/users/sync when more than 100 ldapIds are provided', async () => {
			const ldapIds = Array.from({ length: 101 }, (_, i) => `ldap_${i}`);
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({
					ldapIds,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should succeed /abac/users/sync when exactly 100 usernames are provided (boundary)', async () => {
			const usernames = Array.from({ length: 100 }, (_, i) => `boundary_user_${i}`);
			await request
				.post(`${v1}/abac/users/sync`)
				.set(credentials)
				.send({
					usernames,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		describe('LDAP ABAC room membership sync', () => {
			let roomIdWithAbac: string;

			before(async () => {
				// Ensure the ABAC attribute definition for department exists
				const attrsRes = await request.get(`${v1}/abac/attributes`).set(credentials).expect(200);
				const attrs = attrsRes.body.attributes as IAbacAttributeDefinition[];
				const existingDept = attrs.find((attr) => attr.key === 'department');

				if (!existingDept) {
					await request
						.post(`${v1}/abac/attributes`)
						.set(credentials)
						.send({
							key: 'department',
							values: ['lifeSupport', 'lifeSupport2', 'navControl'],
						})
						.expect(200);
				}

				// Create a private room and add LDAP users that will later lose ABAC compliance
				const roomRes = await createRoom({
					type: 'p',
					name: `ldapAbacRoom-${Date.now()}`,
				});

				roomIdWithAbac = roomRes.body.group._id;

				const davidUser = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'david.scott' }).expect(200);
				const sergeiUser = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'sergei.krikalev' }).expect(200);

				await addAbacAttributesToUserDirectly(davidUser.body.user._id, [{ key: 'department', values: ['navControl'] }]);
				await addAbacAttributesToUserDirectly(sergeiUser.body.user._id, [{ key: 'department', values: ['navControl'] }]);
				await addAbacAttributesToUserDirectly(credentials['X-User-Id'], [{ key: 'department', values: ['navControl'] }]);

				await request
					.post(`${v1}/abac/rooms/${roomIdWithAbac}/attributes/department`)
					.set(credentials)
					.send({
						values: ['navControl'],
					})
					.expect(200);

				// Invite two LDAP users that will initially match the room attributes
				await request
					.post(`${v1}/groups.invite`)
					.set(credentials)
					.send({
						roomId: roomIdWithAbac,
						usernames: ['david.scott', 'sergei.krikalev'],
					});
			});

			after(async () => {
				await deleteRoom({ type: 'p', roomId: roomIdWithAbac });
			});

			it('should remove users from room after LDAP sync changes their ABAC attributes', async () => {
				const initialDept = 'navControl';

				const davidInitialAttrs = [{ key: 'department', values: [initialDept] }];
				const sergeiInitialAttrs = [{ key: 'department', values: [initialDept] }];

				expect(davidInitialAttrs[0].values).to.include(initialDept);
				expect(sergeiInitialAttrs[0].values).to.include(initialDept);

				await request
					.post(`${v1}/abac/users/sync`)
					.set(credentials)
					.send({
						usernames: ['david.scott', 'sergei.krikalev'],
					})
					.expect(200);

				const afterMembersRes = await request.get(`${v1}/groups.members`).set(credentials).query({ roomId: roomIdWithAbac }).expect(200);

				const afterMembers = afterMembersRes.body.members as IUser[];
				const afterUsernames = afterMembers.map((u) => u.username);

				expect(afterUsernames).to.not.include('david.scott');
				expect(afterUsernames).to.not.include('sergei.krikalev');

				const userInfoDavidAfter = await request.get(`${v1}/users.info`).set(credentials).query({ username: 'david.scott' }).expect(200);
				const userInfoSergeiAfter = await request
					.get(`${v1}/users.info`)
					.set(credentials)
					.query({ username: 'sergei.krikalev' })
					.expect(200);

				const davidAfter = userInfoDavidAfter.body.user as IUser;
				const sergeiAfter = userInfoSergeiAfter.body.user as IUser;

				const davidDeptAfter = (davidAfter.abacAttributes || []).find((attr: IAbacAttributeDefinition) => attr.key === 'department');
				const sergeiDeptAfter = (sergeiAfter.abacAttributes || []).find((attr: IAbacAttributeDefinition) => attr.key === 'department');

				expect(davidDeptAfter?.values || []).to.not.deep.equal(davidInitialAttrs[0].values);
				expect(sergeiDeptAfter?.values || []).to.not.deep.equal(sergeiInitialAttrs[0].values);
			});
		});

		after(async () => {
			await Promise.all([
				updateSetting('LDAP_Enable', false),
				updateSetting('ABAC_Enabled', false),
				updateSetting('LDAP_Background_Sync', false),
				updateSetting('LDAP_Background_Sync_Import_New_Users', false),
				updateSetting('LDAP_Host', ''),
				updateSetting('LDAP_Authentication', false),
				updateSetting('LDAP_Authentication_UserDN', ''),
				updateSetting('LDAP_Authentication_Password', ''),
				updateSetting('LDAP_BaseDN', ''),
				updateSetting('LDAP_AD_User_Search_Field', ''),
				updateSetting('LDAP_AD_Username_Field', ''),
				updateSetting('LDAP_Background_Sync_ABAC_Attributes', false),
				updateSetting('LDAP_Background_Sync_ABAC_Attributes_Interval', ''),
				updateSetting('LDAP_ABAC_AttributeMap', ''),
			]);
		});
	});
});
