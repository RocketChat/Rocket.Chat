import type { IRoom, ITeam } from '@rocket.chat/core-typings';
import { TeamType } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { addAbacAttributesToUserDirectly, setRoomAbacAttributesDirectly } from '../../data/abac.helper';
import { api, getCredentials, request, credentials } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
import { updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[ABAC Room Lifecycle] (Enterprise Only)', function () {
	this.retries(0);

	let connection: MongoClient;

	const SETTLE_MS = 500;
	const attributes = [{ key: 'lifecycle_dept', values: ['eng'] }];

	const setAbacEnabled = async (value: boolean) => {
		await updateSetting('ABAC_Enabled', value);
		await sleep(SETTLE_MS);
	};

	const setEnforcement = async (value: boolean) => {
		await updateSetting('ABAC_Enforce_All_Rooms', value);
		await sleep(SETTLE_MS);
	};

	const findRoom = (roomId: IRoom['_id']) =>
		connection.db().collection<Pick<IRoom, '_id' | 'abacAttributes'>>('rocketchat_room').findOne({ _id: roomId });

	const createAbacGroup = async (name: string): Promise<IRoom['_id']> => {
		const room = await createRoom({ type: 'p', name });
		const roomId: IRoom['_id'] = room.body.group._id;
		await setRoomAbacAttributesDirectly(connection, roomId, attributes);
		return roomId;
	};

	const createAbacTeam = async (name: string): Promise<ITeam> => {
		const team = await createTeam(credentials, name, TeamType.PRIVATE);
		await setRoomAbacAttributesDirectly(connection, team.roomId, attributes);
		return team;
	};

	const expectRoomLocked = (roomId: IRoom['_id']) =>
		request
			.post(api('chat.sendMessage'))
			.set(credentials)
			.send({ message: { rid: roomId, msg: 'should not post' } })
			.expect(400)
			.expect((res) => {
				expect(res.body).to.include({ errorType: 'error-abac-room-locked' });
			});

	before((done) => getCredentials(done));

	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);
		await addAbacAttributesToUserDirectly(connection, credentials['X-User-Id'], attributes);
		await setAbacEnabled(true);
	});

	after(async () => {
		await setEnforcement(false);
		await setAbacEnabled(false);
		await addAbacAttributesToUserDirectly(connection, credentials['X-User-Id'], []);
		await connection.close();
	});

	describe('converting a private room to a team', () => {
		const teamNames: string[] = [];

		after(async () => {
			await setEnforcement(false);
			await setAbacEnabled(true);
			await Promise.all(teamNames.map((name) => deleteTeam(credentials, name)));
		});

		const convertToTeam = async (name: string) => {
			const roomId = await createAbacGroup(name);
			teamNames.push(name);
			await request.post(api('groups.convertToTeam')).set(credentials).send({ roomId }).expect(200);
			return roomId;
		};

		it('removes the room attributes', async () => {
			const roomId = await convertToTeam(`abac-lifecycle-to-team-${Date.now()}`);

			expect(await findRoom(roomId)).to.not.have.property('abacAttributes');
		});

		it('records the removal in the audit log', async () => {
			const roomId = await convertToTeam(`abac-lifecycle-to-team-audit-${Date.now()}`);

			const event = await connection
				.db()
				.collection('rocketchat_server_events')
				.findOne({ t: 'abac.object.attributes.removed', data: { $elemMatch: { 'key': 'room', 'value._id': roomId } } });
			expect(event).to.not.be.null;
		});

		it('removes the room attributes while ABAC is disabled', async () => {
			await setAbacEnabled(false);

			const roomId = await convertToTeam(`abac-lifecycle-to-team-off-${Date.now()}`);

			expect(await findRoom(roomId)).to.not.have.property('abacAttributes');
			await setAbacEnabled(true);
		});

		it('locks the team room under enforcement', async () => {
			const name = `abac-lifecycle-to-team-locked-${Date.now()}`;
			const roomId = await createAbacGroup(name);
			teamNames.push(name);
			await setEnforcement(true);

			await request.post(api('groups.convertToTeam')).set(credentials).send({ roomId }).expect(200);

			await expectRoomLocked(roomId);
			await setEnforcement(false);
		});
	});

	describe('converting a team to a channel', () => {
		let team: ITeam;
		let teamRoomId: IRoom['_id'];

		before(async () => {
			team = await createAbacTeam(`abac-lifecycle-to-channel-${Date.now()}`);
			teamRoomId = await createAbacGroup(`abac-lifecycle-in-team-${Date.now()}`);
			await request
				.post(api('teams.addRooms'))
				.set(credentials)
				.send({ teamId: team._id, rooms: [teamRoomId] })
				.expect(200);
			await setRoomAbacAttributesDirectly(connection, teamRoomId, attributes);

			await request.post(api('teams.convertToChannel')).set(credentials).send({ teamId: team._id }).expect(200);
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId: team.roomId });
			await deleteRoom({ type: 'p', roomId: teamRoomId });
		});

		it("removes the team room's attributes", async () => {
			expect(await findRoom(team.roomId)).to.not.have.property('abacAttributes');
		});

		it('keeps the attributes of the rooms that were in the team', async () => {
			expect(await findRoom(teamRoomId)).to.have.deep.property('abacAttributes', attributes);
		});
	});

	describe('moving a room into and out of a team', () => {
		let team: ITeam;
		let movedInRoomId: IRoom['_id'];

		before(async () => {
			team = await createTeam(credentials, `abac-lifecycle-move-${Date.now()}`, TeamType.PRIVATE);
			movedInRoomId = await createAbacGroup(`abac-lifecycle-move-in-${Date.now()}`);
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId: movedInRoomId });
			await deleteTeam(credentials, team.name);
		});

		it('removes the attributes of a room moved into a team', async () => {
			await request
				.post(api('teams.addRooms'))
				.set(credentials)
				.send({ teamId: team._id, rooms: [movedInRoomId] })
				.expect(200);

			expect(await findRoom(movedInRoomId)).to.not.have.property('abacAttributes');
		});

		it('keeps the attributes of a room moved out of a team', async () => {
			await setRoomAbacAttributesDirectly(connection, movedInRoomId, attributes);

			await request.post(api('teams.removeRoom')).set(credentials).send({ teamId: team._id, roomId: movedInRoomId }).expect(200);

			expect(await findRoom(movedInRoomId)).to.have.deep.property('abacAttributes', attributes);
		});
	});

	describe('making a team public through teams.update', () => {
		let team: ITeam;

		before(async () => {
			team = await createAbacTeam(`abac-lifecycle-update-${Date.now()}`);
		});

		after(async () => {
			await setAbacEnabled(true);
			await deleteTeam(credentials, team.name);
		});

		it('is refused while ABAC is enabled', async () => {
			await request
				.post(api('teams.update'))
				.set(credentials)
				.send({ teamId: team._id, data: { type: TeamType.PUBLIC } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.include({ errorType: 'error-action-not-allowed' });
				});

			expect(await findRoom(team.roomId)).to.have.deep.property('abacAttributes', attributes);
		});

		it('removes the attributes while ABAC is disabled', async () => {
			await setAbacEnabled(false);

			await request
				.post(api('teams.update'))
				.set(credentials)
				.send({ teamId: team._id, data: { type: TeamType.PUBLIC } })
				.expect(200);

			expect(await findRoom(team.roomId)).to.not.have.property('abacAttributes');
		});
	});
});
