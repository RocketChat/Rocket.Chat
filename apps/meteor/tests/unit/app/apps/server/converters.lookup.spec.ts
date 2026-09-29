import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const findContact = sandbox.stub();
const findDepartment = sandbox.stub();
const findMessage = sandbox.stub();
const findRole = sandbox.stub();
const findRoomById = sandbox.stub();
const findRoomByName = sandbox.stub();
const findSetting = sandbox.stub();
const findUpload = sandbox.stub();
const findUserById = sandbox.stub();
const findUserByUsername = sandbox.stub();
const findVisitorById = sandbox.stub();
const findVisitorByToken = sandbox.stub();
const getVideoConf = sandbox.stub();

const load = (module: string, stubs: Record<string, unknown>) =>
	proxyquire.noCallThru().load(`../../../../../app/apps/server/converters/${module}`, stubs);

const models = (stores: Record<string, unknown>) => ({ '@rocket.chat/models': stores });

const { AppContactsConverter } = load('contacts', models({ LivechatContacts: { findOneEnabledById: findContact } }));
const { AppDepartmentsConverter } = load('departments', models({ LivechatDepartment: { findOneById: findDepartment } }));
const { AppMessagesConverter } = load('messages', models({ Messages: { findOneById: findMessage } }));
const { AppRolesConverter } = load('roles', models({ Roles: { findOneById: findRole } }));
const { AppRoomsConverter } = load('rooms', models({ Rooms: { findOneById: findRoomById, findOneByName: findRoomByName } }));
const { AppSettingsConverter } = load('settings', models({ Settings: { findOneById: findSetting } }));
const { AppUploadsConverter } = load('uploads', models({ Uploads: { findOneById: findUpload } }));
const { AppUsersConverter } = load('users', models({ Users: { findOneById: findUserById, findOneByUsername: findUserByUsername } }));
const { AppVisitorsConverter } = load(
	'visitors',
	models({ LivechatVisitors: { findOneEnabledById: findVisitorById, getVisitorByToken: findVisitorByToken } }),
);
const { AppVideoConferencesConverter } = load('videoConferences', {
	'@rocket.chat/core-services': { VideoConf: { getUnfiltered: getVideoConf } },
});

const orch = {
	getConverters: () => ({
		get: (key: string) => ({
			convertById: async (id: string) => ({ __converted: key, id }),
			convertToApp: (user: any) => ({ __convertedToApp: key, id: user?._id }),
			convertByToken: async (token: string) => ({ __converted: key, token }),
		}),
	}),
} as unknown as IAppServerOrchestrator;

const contacts = new AppContactsConverter(orch);
const departments = new AppDepartmentsConverter(orch);
const messages = new AppMessagesConverter(orch);
const roles = new AppRolesConverter(orch);
const rooms = new AppRoomsConverter(orch);
const settings = new AppSettingsConverter(orch);
const uploads = new AppUploadsConverter(orch);
const users = new AppUsersConverter(orch);
const visitors = new AppVisitorsConverter(orch);
const videoConferences = new AppVideoConferencesConverter(orch);

const lookups = [
	{
		name: 'AppContactsConverter.convertById',
		stub: findContact,
		run: (key: string) => contacts.convertById(key),
		record: { _id: 'contact-1', name: 'Jane' },
		identifier: (result: any) => result._id,
	},
	{
		name: 'AppDepartmentsConverter.convertById',
		stub: findDepartment,
		run: (key: string) => departments.convertById(key),
		record: { _id: 'dep-1', name: 'Support' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppMessagesConverter.convertById',
		stub: findMessage,
		run: (key: string) => messages.convertById(key),
		record: { _id: 'msg-1', rid: 'room-1', msg: 'hi', u: { _id: 'user-1' } },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppRolesConverter.convertById',
		stub: findRole,
		run: (key: string) => roles.convertById(key),
		record: { _id: 'role-1', name: 'admin' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppRoomsConverter.convertById',
		stub: findRoomById,
		run: (key: string) => rooms.convertById(key),
		record: { _id: 'room-1', t: 'c', name: 'general' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppRoomsConverter.convertByName',
		stub: findRoomByName,
		run: (key: string) => rooms.convertByName(key),
		record: { _id: 'room-1', t: 'c', name: 'general' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppUploadsConverter.convertById',
		stub: findUpload,
		run: (key: string) => uploads.convertById(key),
		record: { _id: 'upload-1', name: 'a.txt', rid: 'room-1' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppUsersConverter.convertById',
		stub: findUserById,
		run: (key: string) => users.convertById(key),
		record: { _id: 'user-1', username: 'john' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppUsersConverter.convertByUsername',
		stub: findUserByUsername,
		run: (key: string) => users.convertByUsername(key),
		record: { _id: 'user-1', username: 'john' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppVisitorsConverter.convertById',
		stub: findVisitorById,
		run: (key: string) => visitors.convertById(key),
		record: { _id: 'visitor-1', token: 'tok-1' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppVisitorsConverter.convertByToken',
		stub: findVisitorByToken,
		run: (key: string) => visitors.convertByToken(key),
		record: { _id: 'visitor-1', token: 'tok-1' },
		identifier: (result: any) => result.id,
	},
	{
		name: 'AppVideoConferencesConverter.convertById',
		stub: getVideoConf,
		run: (key: string) => videoConferences.convertById(key),
		record: { _id: 'call-1', type: 'videoconference' },
		identifier: (result: any) => result._id,
	},
	{
		name: 'AppSettingsConverter.convertById',
		stub: findSetting,
		run: (key: string) => settings.convertById(key),
		record: { _id: 'Some_Setting', type: 'int', value: 42 },
		identifier: (result: any) => result.id,
	},
];

const guards = [
	{ name: 'AppContactsConverter.convertContact', run: (value: any) => contacts.convertContact(value) },
	{ name: 'AppContactsConverter.convertAppContact', run: (value: any) => contacts.convertAppContact(value) },
	{ name: 'AppDepartmentsConverter.convertDepartment', run: (value: any) => departments.convertDepartment(value) },
	{ name: 'AppDepartmentsConverter.convertAppDepartment', run: (value: any) => departments.convertAppDepartment(value) },
	{ name: 'AppMessagesConverter.convertMessage', run: (value: any) => messages.convertMessage(value) },
	{ name: 'AppMessagesConverter.convertMessageRaw', run: (value: any) => messages.convertMessageRaw(value) },
	{ name: 'AppMessagesConverter.convertAppMessage', run: (value: any) => messages.convertAppMessage(value) },
	{ name: 'AppRoomsConverter.convertRoom', run: (value: any) => rooms.convertRoom(value) },
	{ name: 'AppRoomsConverter.convertRoomRaw', run: (value: any) => rooms.convertRoomRaw(value) },
	{ name: 'AppRoomsConverter.convertAppRoom', run: (value: any) => rooms.convertAppRoom(value) },
	{ name: 'AppUploadsConverter.convertToApp', run: (value: any) => uploads.convertToApp(value) },
	{ name: 'AppUploadsConverter.convertToRocketChat', run: (value: any) => uploads.convertToRocketChat(value) },
	{ name: 'AppUsersConverter.convertToApp', run: (value: any) => users.convertToApp(value) },
	{ name: 'AppUsersConverter.convertToRocketChat', run: (value: any) => users.convertToRocketChat(value) },
	{ name: 'AppVideoConferencesConverter.convertVideoConference', run: (value: any) => videoConferences.convertVideoConference(value) },
	{ name: 'AppVisitorsConverter.convertVisitor', run: (value: any) => visitors.convertVisitor(value) },
	{ name: 'AppVisitorsConverter.convertAppVisitor', run: (value: any) => visitors.convertAppVisitor(value) },
];

describe('apps converters — lookups and guard clauses', () => {
	beforeEach(() => {
		sandbox.reset();
	});

	it('queries its own store with the received key and converts the record it finds', async () => {
		for (const { name, stub, run, record, identifier } of lookups) {
			stub.resolves(record);

			const result = await run('lookup-key');

			expect(stub.calledOnce, name).to.be.true;
			expect(stub.firstCall.args[0], name).to.equal('lookup-key');
			expect(identifier(result), name).to.equal(record._id);

			sandbox.reset();
		}
	});

	it('returns undefined when the lookup finds no record', async () => {
		for (const { name, stub, run } of lookups.filter(({ name }) => name !== 'AppSettingsConverter.convertById')) {
			stub.resolves(undefined);

			expect(await run('lookup-key'), name).to.equal(undefined);
		}
	});

	it('returns undefined without querying when the username is missing', async () => {
		expect(await users.convertByUsername(undefined)).to.equal(undefined);
		expect(findUserByUsername.called).to.be.false;
	});

	it('rejects instead of returning undefined when the setting does not exist, having no not-found guard', async () => {
		findSetting.resolves(null);

		await expect(settings.convertById('Missing_Setting')).to.be.rejectedWith(TypeError);
	});

	it('returns undefined for null and undefined input', async () => {
		for (const { name, run } of guards) {
			expect(await run(null), name).to.equal(undefined);
			expect(await run(undefined), name).to.equal(undefined);
		}
	});
});

describe('AppRoomsConverter.convertAppRoom', () => {
	it('treats a room as complete, merging _unmappedProperties_, when no isPartial argument is given', async () => {
		const result: any = await rooms.convertAppRoom({ id: 'c-1', type: 'c', _unmappedProperties_: { spare: 'keep' } } as any);

		expect(result.spare).to.equal('keep');
	});
});
