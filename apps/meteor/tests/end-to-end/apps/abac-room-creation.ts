import type { Credentials } from '@rocket.chat/api-client';
import type { IPermission as IAppPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { App, IAbacAttributeDefinition, IPermission, IRoom, ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, beforeEach, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { addAbacAttributesToUserDirectly } from '../../data/abac.helper';
import { api, credentials, getCredentials, request } from '../../data/api-data';
import { appAbacRoomCreationTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { sleep } from '../../data/livechat/utils';
import { getSettingValueById, updatePermission, updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

type CreateRoomBody = {
	type: 'p' | 'c';
	creatorUsername?: string;
	members?: IUser['username'][];
	abacAttributes?: IAbacAttributeDefinition[];
};

(IS_EE ? describe : describe.skip)('Apps - ABAC room creation', function () {
	this.retries(0);

	const SETTLE_MS = 500;
	const suffix = Date.now();
	const clearance = `app-clearance-${suffix}`;

	const settingIds = [
		'ABAC_Enabled',
		'ABAC_PDP_Type',
		'ABAC_Enforce_All_Rooms',
		'ABAC_Required_Attributes',
		'ABAC_Restrict_To_Owned_Attributes',
	];
	const savedSettings = new Map<string, ISetting['value']>();
	let savedCreatePermissionRoles: string[];

	const grantedWithAbacWrite: IAppPermission[] = [
		{ name: 'api' },
		{ name: 'user.read' },
		{ name: 'room.read' },
		{ name: 'room.write' },
		{ name: 'message.write' },
		{ name: 'abac.write' },
	];

	const createdRoomIds: IRoom['_id'][] = [];

	let connection: MongoClient;
	let app: App;
	let creator: IUser;
	let creatorCredentials: Credentials;
	let unattributedUser: IUser;

	const setSetting = async (id: string, value: ISetting['value']) => {
		await updateSetting(id, value);
		await sleep(SETTLE_MS);
	};

	const requestRoomThroughApp = async (body: CreateRoomBody) => {
		const name = `abac-app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		const res = await request
			.post(apps(`/public/${app.id}/create-room`))
			.set(credentials)
			.send({ name, ...body });

		return { res, name };
	};

	const createRoomThroughApp = async (body: CreateRoomBody) => {
		const { res, name } = await requestRoomThroughApp(body);

		if (res.body.roomId) {
			createdRoomIds.push(res.body.roomId);
		}

		return { res, name };
	};

	const getRoom = async (roomId: IRoom['_id']): Promise<IRoom> => {
		const res = await request.get(api('rooms.info')).set(creatorCredentials).query({ roomId }).expect(200);
		return res.body.room;
	};

	const findRoomsNamed = async (name: string): Promise<IRoom[]> => {
		const res = await request.get(api('rooms.adminRooms')).set(credentials).query({ filter: name }).expect(200);
		return res.body.rooms;
	};

	before((done) => getCredentials(done));

	before(async function () {
		this.timeout(20000);

		connection = await MongoClient.connect(URL_MONGODB);

		for (const id of settingIds) {
			savedSettings.set(id, await getSettingValueById(id));
		}
		const permissions = await request.get(api('permissions.listAll')).set(credentials).expect(200);
		savedCreatePermissionRoles =
			(permissions.body.update as IPermission[]).find(({ _id }) => _id === 'create-abac-managed-room')?.roles ?? [];

		await setSetting('ABAC_Enabled', true);
		await setSetting('ABAC_PDP_Type', 'local');
		await setSetting('ABAC_Enforce_All_Rooms', false);

		await request
			.post('/api/v1/abac/attributes')
			.set(credentials)
			.send({ key: clearance, values: ['secret', 'topsecret'] })
			.expect(200);

		creator = await createUser();
		creatorCredentials = await login(creator.username, password);
		await addAbacAttributesToUserDirectly(connection, creator._id, [{ key: clearance, values: ['secret'] }]);

		unattributedUser = await createUser();
	});

	after(async function () {
		this.timeout(30000);

		await cleanupApps();
		await setSetting('ABAC_Enforce_All_Rooms', false);

		for (const roomId of createdRoomIds) {
			await request.post(api('rooms.delete')).set(credentials).send({ roomId }).expect(200);
		}

		await deleteUser(creator);
		await deleteUser(unattributedUser);

		const res = await request.get('/api/v1/abac/attributes').query({ key: clearance }).set(credentials).expect(200);
		const attribute = (res.body.attributes as { _id: string; key: string }[]).find((a) => a.key === clearance);
		if (attribute) {
			await request.delete(`/api/v1/abac/attributes/${attribute._id}`).set(credentials).expect(200);
		}

		await updatePermission('create-abac-managed-room', savedCreatePermissionRoles);
		for (const [id, value] of savedSettings) {
			await setSetting(id, value);
		}

		await connection.close();
	});

	beforeEach(async () => {
		await updatePermission('create-abac-managed-room', ['admin', 'user']);
		await setSetting('ABAC_Restrict_To_Owned_Attributes', true);
	});

	describe('an app granted abac.write', () => {
		before(async function () {
			this.timeout(20000);

			await cleanupApps();
			app = await installLocalTestPackage(appAbacRoomCreationTest, grantedWithAbacWrite);
		});

		it('creates a private room carrying attributes its creator holds', async () => {
			const { res } = await createRoomThroughApp({
				type: 'p',
				creatorUsername: creator.username,
				abacAttributes: [{ key: clearance, values: ['secret'] }],
			});

			expect(res.status).to.equal(200);
			expect((await getRoom(res.body.roomId)).abacAttributes).to.deep.equal([{ key: clearance, values: ['secret'] }]);
		});

		it('is refused a value its creator does not hold', async () => {
			const { res } = await createRoomThroughApp({
				type: 'p',
				creatorUsername: creator.username,
				abacAttributes: [{ key: clearance, values: ['topsecret'] }],
			});

			expect(res.status).to.equal(400);
			expect(res.body.error).to.include('error-abac-attribute-not-assignable');
		});

		it('is refused attributes when its creator may not assign them', async () => {
			const { res } = await createRoomThroughApp({ type: 'p', abacAttributes: [{ key: clearance, values: ['secret'] }] });

			expect(res.status).to.equal(400);
			expect(res.body.error).to.include('error-abac-attributes-not-allowed');
		});

		it('is refused attributes when its creator lacks create-abac-managed-room, and no room is created', async () => {
			await updatePermission('create-abac-managed-room', ['admin']);

			const { res, name } = await createRoomThroughApp({
				type: 'p',
				creatorUsername: creator.username,
				abacAttributes: [{ key: clearance, values: ['secret'] }],
			});

			expect(res.status).to.equal(400);
			expect(res.body.error).to.include('error-abac-attributes-not-allowed');
			expect(await findRoomsNamed(name)).to.be.empty;
		});

		it('is refused attributes on a public channel', async () => {
			const { res } = await createRoomThroughApp({
				type: 'c',
				creatorUsername: creator.username,
				abacAttributes: [{ key: clearance, values: ['secret'] }],
			});

			expect(res.status).to.equal(400);
			expect(res.body.error).to.include('error-abac-attributes-private-rooms-only');
		});

		it('is refused attributes while ABAC is disabled, and no room is created', async () => {
			await setSetting('ABAC_Enabled', false);

			try {
				const { res, name } = await createRoomThroughApp({
					type: 'p',
					creatorUsername: creator.username,
					abacAttributes: [{ key: clearance, values: ['secret'] }],
				});

				expect(res.status).to.equal(400);
				expect(res.body.error).to.include('error-abac-not-enabled');
				expect(await findRoomsNamed(name)).to.be.empty;
			} finally {
				await setSetting('ABAC_Enabled', true);
			}
		});

		it('leaves out a member who does not carry the attributes, without telling the app', async () => {
			const { res } = await createRoomThroughApp({
				type: 'p',
				creatorUsername: creator.username,
				members: [unattributedUser.username],
				abacAttributes: [{ key: clearance, values: ['secret'] }],
			});

			expect(res.status).to.equal(200);
			expect(res.body).to.have.all.keys('roomId');

			const members = await request.get(api('groups.members')).set(creatorCredentials).query({ roomId: res.body.roomId }).expect(200);
			expect(members.body.members.map(({ username }: IUser) => username)).to.deep.equal([creator.username]);
		});

		it('sends a message as its app user into an ABAC room it is not a member of', async () => {
			const { res } = await createRoomThroughApp({
				type: 'p',
				creatorUsername: creator.username,
				abacAttributes: [{ key: clearance, values: ['secret'] }],
			});
			expect(res.status).to.equal(200);
			const { roomId } = res.body;
			const text = `abac-app-message-${Date.now()}`;

			const sent = await request
				.post(apps(`/public/${app.id}/send-message`))
				.set(credentials)
				.send({ roomId, text });

			expect(sent.status).to.equal(200);
			const message = await request.get(api('chat.getMessage')).set(creatorCredentials).query({ msgId: sent.body.messageId }).expect(200);
			expect(message.body.message).to.include({ rid: roomId, msg: text });
			expect(message.body.message.u.username).to.equal('abac-room-creation-test.bot');

			const members = await request.get(api('groups.members')).set(creatorCredentials).query({ roomId }).expect(200);
			expect(members.body.members.map(({ username }: IUser) => username)).to.deep.equal([creator.username]);
		});

		describe('while enforcement is on', () => {
			before(async () => {
				await setSetting('ABAC_Required_Attributes', [clearance]);
				await setSetting('ABAC_Enforce_All_Rooms', true);
			});

			after(async () => {
				await setSetting('ABAC_Enforce_All_Rooms', false);
				await setSetting('ABAC_Required_Attributes', []);
			});

			it('creates a private room carrying every required attribute', async () => {
				const { res } = await createRoomThroughApp({
					type: 'p',
					creatorUsername: creator.username,
					abacAttributes: [{ key: clearance, values: ['secret'] }],
				});

				expect(res.status).to.equal(200);
				expect((await getRoom(res.body.roomId)).abacAttributes).to.deep.equal([{ key: clearance, values: ['secret'] }]);
			});

			it('is refused a private room without attributes', async () => {
				const { res } = await createRoomThroughApp({ type: 'p', creatorUsername: creator.username });

				expect(res.status).to.equal(400);
				expect(res.body.error).to.include('error-abac-attributes-required');
			});
		});
	});

	describe('an app without abac.write', () => {
		before(async function () {
			this.timeout(20000);

			await cleanupApps();
			app = await installLocalTestPackage(appAbacRoomCreationTest);
		});

		it('is refused a room carrying attributes, and no room is created', async () => {
			const { res, name } = await createRoomThroughApp({
				type: 'p',
				creatorUsername: creator.username,
				abacAttributes: [{ key: clearance, values: ['secret'] }],
			});

			expect(res.status).to.equal(400);
			expect(res.body.error).to.include('abac.write');
			expect(await findRoomsNamed(name)).to.be.empty;
		});

		it('still creates a private room without attributes', async () => {
			const { res } = await createRoomThroughApp({ type: 'p', creatorUsername: creator.username });

			expect(res.status).to.equal(200);
			expect((await getRoom(res.body.roomId)).abacAttributes).to.be.undefined;
		});
	});

	describe('an app without room.write', () => {
		before(async function () {
			this.timeout(20000);

			await cleanupApps();
			app = await installLocalTestPackage(
				appAbacRoomCreationTest,
				grantedWithAbacWrite.filter(({ name }) => name !== 'room.write'),
			);
		});

		it('creates no room carrying attributes, even with abac.write, while finish() resolves', async () => {
			const { res, name } = await requestRoomThroughApp({
				type: 'p',
				creatorUsername: creator.username,
				abacAttributes: [{ key: clearance, values: ['secret'] }],
			});

			expect(res.status).to.equal(200);
			expect(res.body).to.not.have.property('error');
			expect(await findRoomsNamed(name)).to.be.empty;
		});

		it('creates no room without attributes either, while finish() resolves', async () => {
			const { res, name } = await requestRoomThroughApp({ type: 'p', creatorUsername: creator.username });

			expect(res.status).to.equal(200);
			expect(res.body).to.not.have.property('error');
			expect(await findRoomsNamed(name)).to.be.empty;
		});
	});
});
