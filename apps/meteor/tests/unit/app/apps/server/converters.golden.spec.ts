import { expect } from 'chai';
import { describe, it } from 'mocha';

import { AppContactsConverter } from '../../../../../app/apps/server/converters/contacts';
import { AppDepartmentsConverter } from '../../../../../app/apps/server/converters/departments';
import { AppMessagesConverter } from '../../../../../app/apps/server/converters/messages';
import { AppRolesConverter } from '../../../../../app/apps/server/converters/roles';
import { AppRoomsConverter } from '../../../../../app/apps/server/converters/rooms';
import { AppSettingsConverter } from '../../../../../app/apps/server/converters/settings';
import { AppThreadsConverter } from '../../../../../app/apps/server/converters/threads';
import { AppUploadsConverter } from '../../../../../app/apps/server/converters/uploads';
import { AppUsersConverter } from '../../../../../app/apps/server/converters/users';
import { AppVideoConferencesConverter } from '../../../../../app/apps/server/converters/videoConferences';
import { AppVisitorsConverter } from '../../../../../app/apps/server/converters/visitors';

/*
 * Golden snapshots of the converters' deterministic transform methods, captured from the
 * behaviour that existed before the Zod-codec migration. These lock the RC <-> Apps-Engine field
 * mapping (including the `_unmappedProperties_` bucket and pass-through rules) so that each phase
 * of the migration can prove it preserves behaviour exactly.
 *
 * Output is compared after `JSON.parse(JSON.stringify(...))` so Date instances are normalised to
 * ISO strings and `undefined` fields are dropped — matching how these payloads cross the app bridge.
 */

const ts = new Date('2024-01-01T00:00:00.000Z');
const updated = new Date('2024-02-02T00:00:00.000Z');

const json = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

// A stub orchestrator whose cross-converter lookups resolve deterministically, so the decode
// direction of the cross-converter converters (uploads/rooms/messages) can be snapshotted without a
// database.
const stubOrch: any = {
	getConverters: () => ({
		get: (key: string) => ({
			convertById: async (id: string) => ({ __converted: key, id }),
			convertToApp: (u: any) => ({ __convertedToApp: key, id: u?._id }),
			convertByToken: async (token: string) => ({ __converted: key, token }),
		}),
	}),
};

describe('apps converters — golden snapshots (pre-codec behaviour)', () => {
	describe('AppSettingsConverter', () => {
		it('convertToApp maps a setting to the Apps-Engine shape', () => {
			const converter = new AppSettingsConverter(stubOrch);
			const setting = {
				_id: 'Some_Setting',
				type: 'int',
				packageValue: 10,
				values: [{ key: 'a', i18nLabel: 'A' }],
				value: 42,
				public: true,
				hidden: false,
				group: 'General',
				i18nLabel: 'Some_Setting',
				i18nDescription: 'Some_Setting_Description',
				ts,
				_updatedAt: updated,
				sorter: 5,
			};

			expect(json(converter.convertToApp(setting as any))).to.deep.equal({
				id: 'Some_Setting',
				type: 'int',
				packageValue: 10,
				values: [{ key: 'a', i18nLabel: 'A' }],
				value: 42,
				public: true,
				hidden: false,
				group: 'General',
				i18nLabel: 'Some_Setting',
				i18nDescription: 'Some_Setting_Description',
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-02-02T00:00:00.000Z',
			});
		});
	});

	describe('AppUsersConverter', () => {
		const converter = new AppUsersConverter(stubOrch);

		it('convertToApp maps a user to the Apps-Engine shape', () => {
			const user = {
				_id: 'user-1',
				username: 'john.doe',
				emails: [{ address: 'john@example.com', verified: true }],
				type: 'bot',
				active: true,
				name: 'John Doe',
				roles: ['admin', 'user'],
				bio: 'hello',
				status: 'online',
				statusText: 'working',
				statusConnection: 'online',
				utcOffset: -3,
				createdAt: ts,
				_updatedAt: updated,
				lastLogin: ts,
				appId: 'app-1',
				customFields: { foo: 'bar' },
				federated: false,
				federation: undefined,
				freeSwitchExtension: '1001',
				settings: { preferences: { language: 'en' } },
			};

			expect(json(converter.convertToApp(user as any))).to.deep.equal({
				id: 'user-1',
				username: 'john.doe',
				emails: [{ address: 'john@example.com', verified: true }],
				type: 'bot',
				isEnabled: true,
				name: 'John Doe',
				roles: ['admin', 'user'],
				bio: 'hello',
				status: 'online',
				statusText: 'working',
				statusConnection: 'online',
				utcOffset: -3,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-02-02T00:00:00.000Z',
				lastLoginAt: '2024-01-01T00:00:00.000Z',
				appId: 'app-1',
				customFields: { foo: 'bar' },
				isFederated: false,
				sipExtension: '1001',
				settings: { preferences: { language: 'en' } },
			});
		});

		it('convertToRocketChat maps an app user back to the RC shape', () => {
			const appUser = {
				id: 'user-1',
				username: 'john.doe',
				emails: [{ address: 'john@example.com', verified: true }],
				type: 'bot',
				isEnabled: true,
				name: 'John Doe',
				roles: ['admin', 'user'],
				bio: 'hello',
				status: 'online',
				statusConnection: 'online',
				utcOffset: -3,
				createdAt: ts,
				updatedAt: updated,
				lastLoginAt: ts,
				appId: 'app-1',
				isFederated: false,
				federation: undefined,
				sipExtension: '1001',
			};

			expect(json(converter.convertToRocketChat(appUser as any))).to.deep.equal({
				_id: 'user-1',
				username: 'john.doe',
				emails: [{ address: 'john@example.com', verified: true }],
				type: 'bot',
				active: true,
				name: 'John Doe',
				roles: ['admin', 'user'],
				bio: 'hello',
				status: 'online',
				statusConnection: 'online',
				utcOffset: -3,
				createdAt: '2024-01-01T00:00:00.000Z',
				_updatedAt: '2024-02-02T00:00:00.000Z',
				lastLogin: '2024-01-01T00:00:00.000Z',
				appId: 'app-1',
				federated: false,
				freeSwitchExtension: '1001',
			});
		});
	});

	describe('AppVisitorsConverter', () => {
		const converter = new AppVisitorsConverter(stubOrch);

		it('convertVisitor maps a visitor and buckets unmapped fields', async () => {
			const visitor = {
				_id: 'visitor-1',
				username: 'guest-1',
				name: 'Guest One',
				department: 'dep-1',
				_updatedAt: updated,
				token: 'tok-abc',
				phone: [{ phoneNumber: '+15551234' }],
				visitorEmails: [{ address: 'guest@example.com' }],
				livechatData: { note: 'vip' },
				status: 'online',
				activity: ['2024-01'],
				externalIds: ['ext-1'],
				lastChat: { _id: 'room-1', ts },
			};

			expect(json(await converter.convertVisitor(visitor as any))).to.deep.equal({
				id: 'visitor-1',
				username: 'guest-1',
				name: 'Guest One',
				department: 'dep-1',
				updatedAt: '2024-02-02T00:00:00.000Z',
				token: 'tok-abc',
				phone: [{ phoneNumber: '+15551234' }],
				visitorEmails: [{ address: 'guest@example.com' }],
				livechatData: { note: 'vip' },
				status: 'online',
				activity: ['2024-01'],
				externalIds: ['ext-1'],
				_unmappedProperties_: { lastChat: { _id: 'room-1', ts: '2024-01-01T00:00:00.000Z' } },
			});
		});

		it('convertAppVisitor maps an app visitor back and merges unmapped fields', () => {
			const appVisitor = {
				id: 'visitor-1',
				username: 'guest-1',
				name: 'Guest One',
				token: 'tok-abc',
				phone: [{ phoneNumber: '+15551234' }],
				livechatData: { note: 'vip' },
				status: 'online',
				visitorEmails: [{ address: 'guest@example.com' }],
				department: 'dep-1',
				externalIds: ['ext-1'],
				_unmappedProperties_: { customField: 'x' },
			};

			expect(json(converter.convertAppVisitor(appVisitor as any))).to.deep.equal({
				_id: 'visitor-1',
				username: 'guest-1',
				name: 'Guest One',
				token: 'tok-abc',
				phone: [{ phoneNumber: '+15551234' }],
				livechatData: { note: 'vip' },
				status: 'online',
				visitorEmails: [{ address: 'guest@example.com' }],
				department: 'dep-1',
				externalIds: ['ext-1'],
				customField: 'x',
			});
		});
	});

	describe('AppDepartmentsConverter', () => {
		const converter = new AppDepartmentsConverter(stubOrch);

		it('convertDepartment maps a department and buckets unmapped fields', async () => {
			const department = {
				_id: 'dep-1',
				name: 'Support',
				email: 'support@example.com',
				_updatedAt: updated,
				enabled: true,
				numAgents: 3,
				showOnOfflineForm: true,
				description: 'Support dept',
				offlineMessageChannelName: 'offline',
				requestTagBeforeClosingChat: true,
				chatClosingTags: ['done'],
				abandonedRoomsCloseCustomMessage: 'bye',
				waitingQueueMessage: 'please wait',
				departmentsAllowedToForward: ['dep-2'],
				showOnRegistration: false,
				type: 'd',
			};

			expect(json(await converter.convertDepartment(department as any))).to.deep.equal({
				id: 'dep-1',
				name: 'Support',
				email: 'support@example.com',
				updatedAt: '2024-02-02T00:00:00.000Z',
				enabled: true,
				numberOfAgents: 3,
				showOnOfflineForm: true,
				description: 'Support dept',
				offlineMessageChannelName: 'offline',
				requestTagBeforeClosingChat: true,
				chatClosingTags: ['done'],
				abandonedRoomsCloseCustomMessage: 'bye',
				waitingQueueMessage: 'please wait',
				departmentsAllowedToForward: ['dep-2'],
				showOnRegistration: false,
				_unmappedProperties_: { type: 'd' },
			});
		});

		it('convertAppDepartment maps an app department back and merges unmapped fields', () => {
			const appDepartment = {
				id: 'dep-1',
				name: 'Support',
				email: 'support@example.com',
				updatedAt: updated,
				enabled: true,
				numberOfAgents: 3,
				showOnOfflineForm: true,
				showOnRegistration: false,
				description: 'Support dept',
				offlineMessageChannelName: 'offline',
				requestTagBeforeClosingChat: true,
				chatClosingTags: ['done'],
				abandonedRoomsCloseCustomMessage: 'bye',
				waitingQueueMessage: 'please wait',
				departmentsAllowedToForward: ['dep-2'],
				_unmappedProperties_: { extra: 1 },
			};

			expect(json(converter.convertAppDepartment(appDepartment as any))).to.deep.equal({
				_id: 'dep-1',
				name: 'Support',
				email: 'support@example.com',
				_updatedAt: '2024-02-02T00:00:00.000Z',
				enabled: true,
				numAgents: 3,
				showOnOfflineForm: true,
				showOnRegistration: false,
				description: 'Support dept',
				offlineMessageChannelName: 'offline',
				requestTagBeforeClosingChat: true,
				chatClosingTags: ['done'],
				abandonedRoomsCloseCustomMessage: 'bye',
				waitingQueueMessage: 'please wait',
				departmentsAllowedToForward: ['dep-2'],
				extra: 1,
			});
		});
	});

	describe('AppRolesConverter', () => {
		it('convertRole maps a role and buckets unmapped fields', async () => {
			const converter = new AppRolesConverter();
			const role = {
				_id: 'admin',
				name: 'admin',
				description: 'Administrator',
				mandatory2fa: true,
				protected: true,
				scope: 'Users',
				_updatedAt: updated,
			};

			expect(json(await converter.convertRole(role as any))).to.deep.equal({
				id: 'admin',
				name: 'admin',
				description: 'Administrator',
				mandatory2fa: true,
				protected: true,
				scope: 'Users',
				_unmappedProperties_: { _updatedAt: '2024-02-02T00:00:00.000Z' },
			});
		});
	});

	describe('AppVideoConferencesConverter', () => {
		const converter = new AppVideoConferencesConverter();
		const call = {
			_id: 'vc-1',
			type: 'direct',
			rid: 'room-1',
			status: 1,
			createdBy: { _id: 'user-1', username: 'john.doe' },
			createdAt: ts,
		};
		const expected = {
			_id: 'vc-1',
			type: 'direct',
			rid: 'room-1',
			status: 1,
			createdBy: { _id: 'user-1', username: 'john.doe' },
			createdAt: '2024-01-01T00:00:00.000Z',
		};

		it('convertVideoConference passes the call through', () => {
			expect(json(converter.convertVideoConference(call as any))).to.deep.equal(expected);
		});

		it('convertAppVideoConference passes the call through', () => {
			expect(json(converter.convertAppVideoConference(call as any))).to.deep.equal(expected);
		});
	});

	describe('AppContactsConverter', () => {
		const converter = new AppContactsConverter();

		it('convertContact clones the contact unchanged', async () => {
			const contact = {
				_id: 'contact-1',
				_updatedAt: updated,
				name: 'Jane',
				phones: [{ phoneNumber: '+15550000' }],
				emails: [{ address: 'jane@example.com' }],
				unknown: false,
				customFields: { tier: 'gold' },
				createdAt: ts,
				channels: [
					{
						name: 'sms',
						verified: true,
						visitor: { visitorId: 'visitor-1', source: { type: 'sms', id: 'sms-1' } },
						blocked: false,
						lastChat: { _id: 'room-1', ts },
					},
				],
				importIds: ['imp-1'],
			};

			expect(json(await converter.convertContact(contact as any))).to.deep.equal(json(contact));
		});

		it('convertAppContact deep-maps an app contact back, bucketing unmapped fields at each level', async () => {
			const appContact = {
				_id: 'contact-1',
				_updatedAt: updated,
				name: 'Jane',
				phones: [{ phoneNumber: '+15550000', extra: 'drop-me' }],
				emails: [{ address: 'jane@example.com' }],
				contactManager: 'mgr-1',
				unknown: false,
				conflictingFields: [{ field: 'name', value: 'Janet' }],
				customFields: { tier: 'gold' },
				channels: [
					{
						name: 'sms',
						verified: true,
						visitor: { visitorId: 'visitor-1', source: { type: 'sms', id: 'sms-1' } },
						blocked: false,
						field: 'phone',
						value: '+15550000',
						verifiedAt: ts,
						details: { type: 'sms', id: 'sms-1', alias: 'a', label: 'l', sidebarIcon: 'i', defaultIcon: 'd', destination: 'x' },
						lastChat: { _id: 'room-1', ts },
					},
				],
				createdAt: ts,
				lastChat: { _id: 'room-1', ts },
				importIds: ['imp-1'],
			};

			expect(json(await converter.convertAppContact(appContact as any))).to.deep.equal({
				_id: 'contact-1',
				_updatedAt: '2024-02-02T00:00:00.000Z',
				name: 'Jane',
				phones: [{ phoneNumber: '+15550000', _unmappedProperties_: { extra: 'drop-me' } }],
				emails: [{ address: 'jane@example.com', _unmappedProperties_: {} }],
				contactManager: 'mgr-1',
				unknown: false,
				conflictingFields: [{ field: 'name', value: 'Janet', _unmappedProperties_: {} }],
				customFields: { tier: 'gold' },
				channels: [
					{
						name: 'sms',
						verified: true,
						visitor: {
							visitorId: 'visitor-1',
							source: { type: 'sms', id: 'sms-1', _unmappedProperties_: {} },
							_unmappedProperties_: {},
						},
						blocked: false,
						field: 'phone',
						value: '+15550000',
						verifiedAt: '2024-01-01T00:00:00.000Z',
						details: {
							type: 'sms',
							id: 'sms-1',
							alias: 'a',
							label: 'l',
							sidebarIcon: 'i',
							defaultIcon: 'd',
							destination: 'x',
							_unmappedProperties_: {},
						},
						lastChat: { _id: 'room-1', ts: '2024-01-01T00:00:00.000Z', _unmappedProperties_: {} },
						_unmappedProperties_: {},
					},
				],
				createdAt: '2024-01-01T00:00:00.000Z',
				lastChat: { _id: 'room-1', ts: '2024-01-01T00:00:00.000Z', _unmappedProperties_: {} },
				importIds: ['imp-1'],
				_unmappedProperties_: {},
			});
		});
	});

	describe('AppUploadsConverter', () => {
		const converter = new AppUploadsConverter(stubOrch);

		it('convertToApp maps an upload and resolves room/user/visitor via converters', async () => {
			const upload = {
				_id: 'up-1',
				name: 'file.png',
				size: 1234,
				type: 'image/png',
				store: 'GridFS',
				description: 'a file',
				complete: true,
				uploading: false,
				extension: 'png',
				progress: 1,
				etag: 'etag-1',
				path: '/path',
				token: 'up-tok',
				url: 'http://example/file.png',
				_updatedAt: updated,
				uploadedAt: ts,
				rid: 'room-1',
				userId: 'user-1',
				visitorToken: 'tok-abc',
			};

			expect(json(await converter.convertToApp(upload as any))).to.deep.equal({
				id: 'up-1',
				name: 'file.png',
				size: 1234,
				type: 'image/png',
				store: 'GridFS',
				description: 'a file',
				complete: true,
				uploading: false,
				extension: 'png',
				progress: 1,
				etag: 'etag-1',
				path: '/path',
				token: 'up-tok',
				url: 'http://example/file.png',
				updatedAt: '2024-02-02T00:00:00.000Z',
				uploadedAt: '2024-01-01T00:00:00.000Z',
				room: { __converted: 'rooms', id: 'room-1' },
				user: { __converted: 'users', id: 'user-1' },
				visitor: { __converted: 'visitors', token: 'tok-abc' },
				_unmappedProperties_: {},
			});
		});

		it('convertToRocketChat maps an app upload back and merges unmapped fields', () => {
			const appUpload = {
				id: 'up-1',
				name: 'file.png',
				size: 1234,
				type: 'image/png',
				extension: 'png',
				description: 'a file',
				store: 'GridFS',
				etag: 'etag-1',
				complete: true,
				uploading: false,
				progress: 1,
				token: 'up-tok',
				url: 'http://example/file.png',
				updatedAt: updated,
				uploadedAt: ts,
				room: { id: 'room-1' },
				user: { id: 'user-1' },
				visitor: { token: 'tok-abc' },
				_unmappedProperties_: { extraUpload: true },
			};

			expect(json(converter.convertToRocketChat(appUpload as any))).to.deep.equal({
				_id: 'up-1',
				name: 'file.png',
				size: 1234,
				type: 'image/png',
				extension: 'png',
				description: 'a file',
				store: 'GridFS',
				etag: 'etag-1',
				complete: true,
				uploading: false,
				progress: 1,
				token: 'up-tok',
				url: 'http://example/file.png',
				_updatedAt: '2024-02-02T00:00:00.000Z',
				uploadedAt: '2024-01-01T00:00:00.000Z',
				rid: 'room-1',
				userId: 'user-1',
				visitorToken: 'tok-abc',
				extraUpload: true,
			});
		});
	});
});

/*
 * Decode-direction golden snapshots for the async, cross-converter converters (rooms, messages,
 * threads). These are the highest-risk converters for mapping drift (the `transformMappedData` ->
 * `mappedDecodeAsync` swap), yet previously had no golden coverage. Cross-converter lookups resolve
 * through `stubOrch`, so these snapshots run without a database.
 */
describe('apps converters — decode golden snapshots (rooms/messages/threads)', () => {
	describe('AppRoomsConverter.convertRoom', () => {
		const converter = new AppRoomsConverter(stubOrch);

		it('maps a channel room: renames, boolean/type function fields, creator lookup, bucket', async () => {
			const result = await converter.convertRoom({
				_id: 'GENERAL',
				t: 'c',
				fname: 'General',
				name: 'general',
				u: { _id: 'owner-1' },
				msgs: 10,
				ts,
				_updatedAt: updated,
				default: true,
				ro: false,
				customFields: { a: 1 },
				teamId: 'team-1',
				teamMain: true,
				federated: false,
				lastMessage: { _id: 'lm-1' },
			} as any);

			expect(json(result)).to.deep.equal({
				id: 'GENERAL',
				displayName: 'General',
				slugifiedName: 'general',
				messageCount: 10,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-02-02T00:00:00.000Z',
				customFields: { a: 1 },
				teamId: 'team-1',
				isTeamMain: true,
				isFederated: false,
				isDefault: true,
				isReadOnly: false,
				displaySystemMessages: true,
				type: 'c',
				creator: { __converted: 'users', id: 'owner-1' },
				_unmappedProperties_: { lastMessage: { _id: 'lm-1' } },
			});
		});

		it('maps a livechat room: visitor/contact/department/closedBy/servedBy/responseBy/parentRoom + secure fields', async () => {
			const result = await converter.convertRoom({
				_id: 'lc-1',
				t: 'l',
				fname: 'Chat',
				msgs: 3,
				ts,
				_updatedAt: updated,
				closer: 'user',
				closedBy: { _id: 'closer-1' },
				servedBy: { _id: 'agent-1' },
				responseBy: { _id: 'resp-1' },
				v: { _id: 'visitor-1', phone: '+15550000', lastMessageTs: ts },
				departmentId: 'dep-1',
				contactId: 'contact-1',
				prid: 'parent-1',
				open: true,
				waitingResponse: true,
				sysMes: false,
				abacAttributes: { level: 'secret' },
				spare: 'keep',
			} as any);

			expect(json(result)).to.deep.equal({
				'id': 'lc-1',
				'displayName': 'Chat',
				'messageCount': 3,
				'createdAt': '2024-01-01T00:00:00.000Z',
				'updatedAt': '2024-02-02T00:00:00.000Z',
				'isWaitingResponse': true,
				'isOpen': true,
				'closer': 'user',
				'isDefault': false,
				'isReadOnly': false,
				'displaySystemMessages': false,
				'type': 'l',
				'visitor': { __converted: 'visitors', id: 'visitor-1' },
				'contact': { __converted: 'contacts', id: 'contact-1' },
				'visitorChannelInfo': { phone: '+15550000', lastMessageTs: '2024-01-01T00:00:00.000Z' },
				'department': { __converted: 'departments', id: 'dep-1' },
				'closedBy': { __converted: 'users', id: 'closer-1' },
				'servedBy': { __converted: 'users', id: 'agent-1' },
				'responseBy': { __converted: 'users', id: 'resp-1' },
				'parentRoom': { __converted: 'rooms', id: 'parent-1' },
				'@@SecureFields': [{ permission: 'abac.read', name: 'abacAttributes', value: { level: 'secret' } }],
				'_unmappedProperties_': {
					v: { _id: 'visitor-1', phone: '+15550000', lastMessageTs: '2024-01-01T00:00:00.000Z' },
					contactId: 'contact-1',
					spare: 'keep',
				},
			});
		});
	});

	describe('AppRoomsConverter.convertRoomRaw', () => {
		const converter = new AppRoomsConverter(stubOrch);

		it('maps a raw room without cross-converter resolution (inline user/visitor lookups)', async () => {
			const result = await converter.convertRoomRaw({
				_id: 'lc-2',
				t: 'l',
				fname: 'Raw',
				msgs: 1,
				ts,
				_updatedAt: updated,
				v: { _id: 'visitor-2', username: 'guest', extra: 'x' },
				closer: 'visitor',
				closedBy: { _id: 'visitor-2', username: 'guest' },
				u: { _id: 'owner-2', username: 'owner', name: 'Owner' },
				leftover: true,
			} as any);

			expect(json(result)).to.deep.equal({
				id: 'lc-2',
				displayName: 'Raw',
				messageCount: 1,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-02-02T00:00:00.000Z',
				closer: 'visitor',
				visitor: { id: 'visitor-2', username: 'guest', extra: 'x' },
				displaySystemMessages: true,
				type: 'l',
				creator: { _id: 'owner-2', username: 'owner', name: 'Owner' },
				closedBy: { _id: 'visitor-2', username: 'guest' },
				_unmappedProperties_: { leftover: true },
			});
		});
	});

	describe('AppMessagesConverter.convertMessage', () => {
		const converter = new AppMessagesConverter(stubOrch);

		it('maps a message: room/editor/sender lookups, attachment sub-map, bucket', async () => {
			const result = await converter.convertMessage({
				_id: 'msg-1',
				rid: 'GENERAL',
				tmid: 'thread-1',
				u: { _id: 'user-1', username: 'u1' },
				msg: 'hello',
				ts,
				_updatedAt: updated,
				t: 'p',
				editedBy: { _id: 'editor-1' },
				editedAt: updated,
				emoji: ':smile:',
				alias: 'alias-1',
				groupable: false,
				attachments: [
					{
						text: 'attachment text',
						ts,
						author_name: 'Author',
						author_link: 'http://a',
						author_icon: 'http://i',
						title: 'Title',
						title_link: 'http://t',
						image_url: 'http://img',
						fields: [{ title: 'f', value: 'v' }],
					},
				],
				spare: 'keep',
			} as any);

			expect(json(result)).to.deep.equal({
				id: 'msg-1',
				threadId: 'thread-1',
				text: 'hello',
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-02-02T00:00:00.000Z',
				editedAt: '2024-02-02T00:00:00.000Z',
				emoji: ':smile:',
				alias: 'alias-1',
				groupable: false,
				type: 'p',
				room: { __converted: 'rooms', id: 'GENERAL' },
				editor: { __converted: 'users', id: 'editor-1' },
				attachments: [
					{
						text: 'attachment text',
						imageUrl: 'http://img',
						fields: [{ title: 'f', value: 'v' }],
						author: { name: 'Author', link: 'http://a', icon: 'http://i' },
						title: { value: 'Title', link: 'http://t' },
						timestamp: '2024-01-01T00:00:00.000Z',
						_unmappedProperties_: {},
					},
				],
				sender: { __converted: 'users', id: 'user-1' },
				_unmappedProperties_: { spare: 'keep' },
			});
		});

		it('sender falls back to the original message.u when the primary lookup resolves to nothing', async () => {
			// Old system messages from visitors have no `token`, so the primary lookup can miss; the
			// fallback must still receive the original sender rather than the already-deleted `message.u`.
			const fallbackOrch: any = {
				getConverters: () => ({
					get: (key: string) => ({
						convertById: async () => undefined,
						convertToApp: (u: any) => (u ? { __fallback: key, id: u._id } : undefined),
						convertByToken: async () => undefined,
					}),
				}),
			};
			const fallbackConverter = new AppMessagesConverter(fallbackOrch);

			const result = await fallbackConverter.convertMessage({
				_id: 'msg-3',
				rid: 'GENERAL',
				u: { _id: 'user-9', username: 'u9' },
				msg: 'hi',
				ts,
				_updatedAt: updated,
				t: 'p',
			} as any);

			expect((json(result) as any).sender).to.deep.equal({ __fallback: 'users', id: 'user-9' });
		});
	});

	describe('AppMessagesConverter.convertMessageRaw', () => {
		const converter = new AppMessagesConverter(stubOrch);

		it('maps a raw message (roomId/editor/sender/threadMsgCount pass-through, bucket)', async () => {
			const result = await converter.convertMessageRaw({
				_id: 'msg-2',
				rid: 'GENERAL',
				u: { _id: 'user-2' },
				msg: 'raw',
				ts,
				_updatedAt: updated,
				t: 'p',
				tcount: 4,
				editedBy: { _id: 'editor-2' },
				leftover: 1,
			} as any);

			expect(json(result)).to.deep.equal({
				id: 'msg-2',
				text: 'raw',
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-02-02T00:00:00.000Z',
				roomId: 'GENERAL',
				editor: { _id: 'editor-2' },
				sender: { _id: 'user-2' },
				threadMsgCount: 4,
				type: 'p',
				_unmappedProperties_: { leftover: 1 },
			});
		});
	});

	describe('AppThreadsConverter.convertMessage', () => {
		const converter = new AppThreadsConverter(stubOrch);
		const convertUserById = (async (id: string) => ({ __converted: 'users', id })) as any;
		const convertToApp = ((u: any) => ({ __convertedToApp: 'users', id: u?._id })) as any;

		it('maps a thread reply: injected room, editor/sender via passed-in lookups, attachment sub-map, bucket', async () => {
			const result = await converter.convertMessage(
				{
					_id: 'tmsg-1',
					rid: 'GENERAL',
					tmid: 'thread-1',
					u: { _id: 'user-3', username: 'u3' },
					msg: 'reply',
					ts,
					_updatedAt: updated,
					editedBy: { _id: 'editor-3' },
					editedAt: updated,
					attachments: [{ text: 'a', ts, title: 'T', title_link: 'http://t' }],
					spare: 'keep',
				} as any,
				{ id: 'GENERAL' } as any,
				convertUserById,
				convertToApp,
			);

			expect(json(result)).to.deep.equal({
				id: 'tmsg-1',
				threadId: 'thread-1',
				text: 'reply',
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-02-02T00:00:00.000Z',
				editedAt: '2024-02-02T00:00:00.000Z',
				room: { id: 'GENERAL' },
				attachments: [
					{
						text: 'a',
						title: { value: 'T', link: 'http://t' },
						timestamp: '2024-01-01T00:00:00.000Z',
						_unmappedProperties_: {},
					},
				],
				sender: { __converted: 'users', id: 'user-3' },
				_unmappedProperties_: {
					rid: 'GENERAL',
					u: { _id: 'user-3', username: 'u3' },
					editedBy: { _id: 'editor-3' },
					spare: 'keep',
				},
			});
		});
	});
});
