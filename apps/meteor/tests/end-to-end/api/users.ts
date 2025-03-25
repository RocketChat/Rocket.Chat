import crypto from 'crypto';

import type { Credentials } from '@rocket.chat/api-client';
import type { IGetRoomRoles, IRoom, ISubscription, ITeam, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import type { PaginatedResult, DefaultUserInfo } from '@rocket.chat/rest-typings';
import { assert, expect } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { getCredentials, api, request, credentials, apiEmail, apiUsername, wait, reservedWords } from '../../data/api-data';
import { imgURL } from '../../data/interactions';
import { createAgent, makeAgentAvailable } from '../../data/livechat/rooms';
import { removeAgent, getAgent } from '../../data/livechat/users';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import type { ActionRoomParams } from '../../data/rooms.helper';
import { actionRoom, createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import type { IUserWithCredentials } from '../../data/user';
import { adminEmail, password, adminUsername } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, login, deleteUser, getUserByUsername } from '../../data/users.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

const MAX_BIO_LENGTH = 260;
const MAX_NICKNAME_LENGTH = 120;

const customFieldText = {
	type: 'text',
	required: true,
	minLength: 2,
	maxLength: 10,
};

function setCustomFields(customFields: unknown) {
	const stringified = customFields ? JSON.stringify(customFields) : '';

	return request.post(api('settings/Accounts_CustomFields')).set(credentials).send({ value: stringified }).expect(200);
}

function clearCustomFields() {
	return setCustomFields(null);
}

const joinChannel = ({ overrideCredentials = credentials, roomId }: { overrideCredentials: Credentials; roomId: IRoom['_id'] }) =>
	request.post(api('channels.join')).set(overrideCredentials).send({
		roomId,
	});

const inviteToChannel = ({
	overrideCredentials = credentials,
	roomId,
	userId,
}: {
	overrideCredentials?: Credentials;
	roomId: IRoom['_id'];
	userId: IUser['_id'];
}) =>
	request.post(api('channels.invite')).set(overrideCredentials).send({
		userId,
		roomId,
	});

const addRoomOwner = ({ type, roomId, userId }: { type: ActionRoomParams['type']; roomId: IRoom['_id']; userId: IUser['_id'] }) =>
	actionRoom({ action: 'addOwner', type, roomId, extraData: { userId } });

const removeRoomOwner = ({ type, roomId, userId }: { type: ActionRoomParams['type']; roomId: IRoom['_id']; userId: IUser['_id'] }) =>
	actionRoom({ action: 'removeOwner', type, roomId, extraData: { userId } });

const getChannelRoles = async ({
	roomId,
	overrideCredentials = credentials,
}: {
	roomId: IRoom['_id'];
	overrideCredentials?: Credentials;
}) =>
	(
		await request.get(api('channels.roles')).set(overrideCredentials).query({
			roomId,
		})
	).body.roles as IGetRoomRoles[];

const setRoomConfig = ({ roomId, favorite, isDefault }: { roomId: IRoom['_id']; favorite?: boolean; isDefault: boolean }) => {
	return request
		.post(api('rooms.saveRoomSettings'))
		.set(credentials)
		.send({
			rid: roomId,
			default: isDefault,
			favorite: favorite
				? {
						defaultValue: true,
						favorite: false,
					}
				: undefined,
		});
};

const preferences = {
	data: {
		newRoomNotification: 'door',
		newMessageNotification: 'chime',
		muteFocusedConversations: true,
		clockMode: 1,
		useEmojis: true,
		convertAsciiEmoji: true,
		saveMobileBandwidth: true,
		collapseMediaByDefault: false,
		autoImageLoad: true,
		emailNotificationMode: 'mentions',
		unreadAlert: true,
		notificationsSoundVolume: 100,
		desktopNotifications: 'default',
		pushNotifications: 'default',
		enableAutoAway: true,
		highlights: [],
		desktopNotificationRequireInteraction: false,
		hideUsernames: false,
		hideRoles: false,
		displayAvatars: true,
		hideFlexTab: false,
		sendOnEnter: 'normal',
		idleTimeLimit: 3600,
		notifyCalendarEvents: false,
		enableMobileRinging: false,
		...(IS_EE && {
			omnichannelTranscriptPDF: false,
		}),
	},
};

const getUserStatus = (userId: IUser['_id']) =>
	new Promise<{
		status: 'online' | 'offline' | 'away' | 'busy';
		message?: string;
		_id?: string;
		connectionStatus?: 'online' | 'offline' | 'away' | 'busy';
	}>((resolve) => {
		void request
			.get(api('users.getStatus'))
			.query({ userId })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((_end, res) => {
				resolve(res.body);
			});
	});

const registerUser = async (
	userData: {
		username?: string;
		email?: string;
		name?: string;
		pass?: string;
	} = {},
	overrideCredentials = credentials,
) => {
	const username = userData.username || `user.test.${Date.now()}`;
	const email = userData.email || `${username}@rocket.chat`;
	const result = await request
		.post(api('users.register'))
		.set(overrideCredentials)
		.send({ email, name: username, username, pass: password, ...userData });

	return result.body.user;
};

// For changing user data when it's not possible to do so via API
const updateUserInDb = async (userId: IUser['_id'], userData: Partial<IUser>) => {
	const connection = await MongoClient.connect(URL_MONGODB);

	await connection
		.db()
		.collection('users')
		.updateOne({ _id: userId as any }, { $set: { ...userData } });

	await connection.close();
};

describe('[Users]', () => {
	let targetUser: { _id: IUser['_id']; username: string };
	let userCredentials: Credentials;

	before((done) => getCredentials(done));

	before('should create a new user', async () => {
		const user = await createUser({
			active: true,
			roles: ['user'],
			joinDefaultChannels: true,
			verified: true,
		});
		targetUser = {
			_id: user._id,
			username: user.username,
		};
		userCredentials = await login(user.username, password);
	});

	after(() => Promise.all([deleteUser(targetUser), updateSetting('E2E_Enable', false)]));

	it('enabling E2E in server and generating keys to user...', async () => {
		await updateSetting('E2E_Enable', true);
		await request
			.post(api('e2e.setUserPublicAndPrivateKeys'))
			.set(userCredentials)
			.send({
				private_key: 'test',
				public_key: 'test',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			});
		await request
			.get(api('e2e.fetchMyKeys'))
			.set(userCredentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('public_key', 'test');
				expect(res.body).to.have.property('private_key', 'test');
			});
	});

	it('should fail when trying to set keys for a user with keys already set', async () => {
		await request
			.post(api('e2e.setUserPublicAndPrivateKeys'))
			.set(userCredentials)
			.send({
				private_key: 'test',
				public_key: 'test',
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error', 'Keys already set [error-keys-already-set]');
			});
	});

	describe('[/users.create]', () => {
		before(async () => clearCustomFields());
		after(async () => clearCustomFields());

		it('should create a new user with custom fields', async () => {
			await setCustomFields({ customFieldText });

			const username = `customField_${apiUsername}`;
			const email = `customField_${apiEmail}`;
			const customFields = { customFieldText: 'success' };

			const res = await request
				.post(api('users.create'))
				.set(credentials)
				.send({
					email,
					name: username,
					username,
					password,
					active: true,
					roles: ['user'],
					joinDefaultChannels: true,
					verified: true,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.nested.property('user.username', username);
			expect(res.body).to.have.nested.property('user.emails[0].address', email);
			expect(res.body).to.have.nested.property('user.active', true);
			expect(res.body).to.have.nested.property('user.name', username);
			expect(res.body).to.have.nested.property('user.customFields.customFieldText', 'success');
			expect(res.body).to.not.have.nested.property('user.e2e');

			const { user } = res.body;

			await deleteUser(user);
		});

		function failCreateUser(name: string) {
			it(`should not create a new user if username is the reserved word ${name}`, (done) => {
				void request
					.post(api('users.create'))
					.set(credentials)
					.send({
						email: `create_user_fail_${apiEmail}`,
						name: `create_user_fail_${apiUsername}`,
						username: name,
						password,
						active: true,
						roles: ['user'],
						joinDefaultChannels: true,
						verified: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', `${name} is blocked and can't be used! [error-blocked-username]`);
					})
					.end(done);
			});
		}

		function failUserWithCustomField(field: { name: string; value: unknown; reason: string }) {
			it(`should not create a user if a custom field ${field.reason}`, async () => {
				await setCustomFields({ customFieldText });

				const customFields: Record<string, unknown> = {};
				customFields[field.name] = field.value;

				await request
					.post(api('users.create'))
					.set(credentials)
					.send({
						email: `customField_fail_${apiEmail}`,
						name: `customField_fail_${apiUsername}`,
						username: `customField_fail_${apiUsername}`,
						password,
						active: true,
						roles: ['user'],
						joinDefaultChannels: true,
						verified: true,
						customFields,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-user-registration-custom-field');
					});
			});
		}

		[
			{ name: 'customFieldText', value: '', reason: 'is required and missing' },
			{ name: 'customFieldText', value: '0', reason: 'length is less than minLength' },
			{ name: 'customFieldText', value: '0123456789-0', reason: 'length is more than maxLength' },
		].forEach((field) => {
			failUserWithCustomField(field);
		});

		reservedWords.forEach((name) => {
			failCreateUser(name);
		});

		describe('users default roles configuration', () => {
			const users: IUser[] = [];

			before(async () => {
				await updateSetting('Accounts_Registration_Users_Default_Roles', 'user,admin');
			});

			after(async () => {
				await updateSetting('Accounts_Registration_Users_Default_Roles', 'user');

				await Promise.all(users.map((user) => deleteUser(user)));
			});

			it('should create a new user with default roles', (done) => {
				const username = `defaultUserRole_${apiUsername}${Date.now()}`;
				const email = `defaultUserRole_${apiEmail}${Date.now()}`;

				void request
					.post(api('users.create'))
					.set(credentials)
					.send({
						email,
						name: username,
						username,
						password,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.username', username);
						expect(res.body).to.have.nested.property('user.emails[0].address', email);
						expect(res.body).to.have.nested.property('user.active', true);
						expect(res.body).to.have.nested.property('user.name', username);
						expect(res.body.user.roles).to.have.members(['user', 'admin']);

						users.push(res.body.user);
					})
					.end(done);
			});

			it('should create a new user with only the role provided', (done) => {
				const username = `defaultUserRole_${apiUsername}${Date.now()}`;
				const email = `defaultUserRole_${apiEmail}${Date.now()}`;

				void request
					.post(api('users.create'))
					.set(credentials)
					.send({
						email,
						name: username,
						username,
						password,
						roles: ['guest'],
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.username', username);
						expect(res.body).to.have.nested.property('user.emails[0].address', email);
						expect(res.body).to.have.nested.property('user.active', true);
						expect(res.body).to.have.nested.property('user.name', username);
						expect(res.body.user.roles).to.have.members(['guest']);

						users.push(res.body.user);
					})
					.end(done);
			});
		});

		describe('auto join default channels', () => {
			let defaultTeamRoomId: IRoom['_id'];
			let defaultTeamId: ITeam['_id'];
			let group: IRoom;
			let user: IUser;
			let userCredentials: Credentials;
			let user2: IUser;
			let user3: IUser;
			let userNoDefault: IUser;
			const teamName = `defaultTeam_${Date.now()}`;

			before(async () => {
				const defaultTeam = await createTeam(credentials, teamName, 0);
				defaultTeamRoomId = defaultTeam.roomId;
				defaultTeamId = defaultTeam._id;
			});

			before(async () => {
				const { body } = await createRoom({
					name: `defaultGroup_${Date.now()}`,
					type: 'p',
					credentials,
					extraData: {
						broadcast: false,
						encrypted: false,
						teamId: defaultTeamId,
						topic: '',
					},
				});
				group = body.group;
			});

			after(() =>
				Promise.all([
					deleteRoom({ roomId: group._id, type: 'p' }),
					deleteTeam(credentials, teamName),
					deleteUser(user),
					deleteUser(user2),
					deleteUser(user3),
					deleteUser(userNoDefault),
				]),
			);

			it('should not create subscriptions to non default teams or rooms even if joinDefaultChannels is true', async () => {
				userNoDefault = await createUser({ joinDefaultChannels: true });
				const noDefaultUserCredentials = await login(userNoDefault.username, password);
				await request
					.get(api('subscriptions.getOne'))
					.set(noDefaultUserCredentials)
					.query({ roomId: defaultTeamRoomId })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription').that.is.null;
					});

				await request
					.get(api('subscriptions.getOne'))
					.set(noDefaultUserCredentials)
					.query({ roomId: group._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription').that.is.null;
					});
			});

			it('should create a subscription for a default team room if joinDefaultChannels is true', async () => {
				await setRoomConfig({ roomId: defaultTeamRoomId, favorite: true, isDefault: true });

				user = await createUser({ joinDefaultChannels: true });
				userCredentials = await login(user.username, password);
				await request
					.get(api('subscriptions.getOne'))
					.set(userCredentials)
					.query({ roomId: defaultTeamRoomId })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription');
						expect(res.body.subscription).to.have.property('rid', defaultTeamRoomId);
					});
			});

			it('should NOT create a subscription for non auto-join rooms inside a default team', async () => {
				await request
					.get(api('subscriptions.getOne'))
					.set(userCredentials)
					.query({ roomId: group._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription').that.is.null;
					});
			});

			it('should create a subscription for the user in all the auto join rooms of the team', async () => {
				await request.post(api('teams.updateRoom')).set(credentials).send({
					roomId: group._id,
					isDefault: true,
				});

				user2 = await createUser({ joinDefaultChannels: true });
				const user2Credentials = await login(user2.username, password);

				await request
					.get(api('subscriptions.getOne'))
					.set(user2Credentials)
					.query({ roomId: group._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription');
						expect(res.body.subscription).to.have.property('rid', group._id);
					});
			});

			it('should create a subscription for a default room inside a non default team', async () => {
				await setRoomConfig({ roomId: defaultTeamRoomId, isDefault: false });
				await setRoomConfig({ roomId: group._id, favorite: true, isDefault: true });

				user3 = await createUser({ joinDefaultChannels: true });
				const user3Credentials = await login(user3.username, password);

				// New user should be subscribed to the default room inside a team
				await request
					.get(api('subscriptions.getOne'))
					.set(user3Credentials)
					.query({ roomId: group._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription');
						expect(res.body.subscription).to.have.property('rid', group._id);
					});

				// New user should not be subscribed to the parent team
				await request
					.get(api('subscriptions.getOne'))
					.set(user3Credentials)
					.query({ roomId: defaultTeamRoomId })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription').that.is.null;
					});
			});
		});
	});

	describe('[/users.register]', () => {
		const email = `email@email${Date.now()}.com`;
		const username = `myusername${Date.now()}`;
		let user: IUser;

		after(async () => deleteUser(user));

		it('should register new user', (done) => {
			void request
				.post(api('users.register'))
				.send({
					email,
					name: 'name',
					username,
					pass: 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.username', username);
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', 'name');
					user = res.body.user;
				})
				.end(done);
		});

		it('should return an error when trying register new user with an invalid username', (done) => {
			void request
				.post(api('users.register'))
				.send({
					email,
					name: 'name',
					username: 'test$username<>',
					pass: 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.equal('The username provided is not valid');
				})
				.end(done);
		});

		it('should return an error when trying register new user with an existing username', (done) => {
			void request
				.post(api('users.register'))
				.send({
					email,
					name: 'name',
					username,
					pass: 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.equal('Username is already in use');
				})
				.end(done);
		});
		it("should return an error when registering a user's name with invalid characters: >, <, /, or \\", (done) => {
			void request
				.post(api('users.register'))
				.send({
					email,
					name: '</\\name>',
					username,
					pass: 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.equal('Name contains invalid characters');
				})
				.end(done);
		});
	});

	describe('[/users.info]', () => {
		let infoRoom: IRoom;

		before(async () => {
			infoRoom = (
				await createRoom({
					type: 'c',
					name: `channel.test.info.${Date.now()}-${Math.random()}`,
					members: [targetUser.username],
				})
			).body.channel;
		});

		after(() =>
			Promise.all([
				updatePermission('view-other-user-channels', ['admin']),
				updatePermission('view-full-other-user-info', ['admin']),
				deleteRoom({ type: 'c', roomId: infoRoom._id }),
			]),
		);

		it('should return an error when the user does not exist', (done) => {
			void request
				.get(api('users.info'))
				.set(credentials)
				.query({
					username: 'invalid-username',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should query information about a user by userId', (done) => {
			void request
				.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.username', targetUser.username);
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', targetUser.username);
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});

		it('should return "rooms" property when user request it and the user has the necessary permission (admin, "view-other-user-channels")', (done) => {
			void request
				.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUser._id,
					includeUserRooms: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.rooms').and.to.be.an('array');
					const createdRoom = (res.body.user.rooms as ISubscription[]).find((room) => room.rid === infoRoom._id);
					expect(createdRoom).to.have.property('unread');
				})
				.end(done);
		});

		it('should NOT return "rooms" property when user NOT request it but the user has the necessary permission (admin, "view-other-user-channels")', (done) => {
			void request
				.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.not.have.nested.property('user.rooms');
				})
				.end(done);
		});

		it('should return the rooms when the user request your own rooms but he does NOT have the necessary permission', (done) => {
			void updatePermission('view-other-user-channels', []).then(() => {
				void request
					.get(api('users.info'))
					.set(credentials)
					.query({
						userId: credentials['X-User-Id'],
						includeUserRooms: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.rooms');
						expect(res.body.user.rooms).with.lengthOf.at.least(1);
						expect(res.body.user.rooms[0]).to.have.property('unread');
					})
					.end(done);
			});
		});
		it("should NOT return the rooms when the user request another user's rooms and he does NOT have the necessary permission", (done) => {
			void updatePermission('view-other-user-channels', []).then(() => {
				void request
					.get(api('users.info'))
					.set(credentials)
					.query({
						userId: targetUser._id,
						fields: JSON.stringify({ userRooms: 1 }),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.nested.property('user.rooms');
					})
					.end(done);
			});
		});
		it("should NOT return any services fields when request to another user's info even if the user has the necessary permission", (done) => {
			void updatePermission('view-full-other-user-info', ['admin']).then(() => {
				void request
					.get(api('users.info'))
					.set(credentials)
					.query({
						userId: targetUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.nested.property('user.services.emailCode');
						expect(res.body).to.not.have.nested.property('user.services');
					})
					.end(done);
			});
		});
		it('should return all services fields when request for myself data even without privileged permission', (done) => {
			void updatePermission('view-full-other-user-info', []).then(() => {
				void request
					.get(api('users.info'))
					.set(credentials)
					.query({
						userId: credentials['X-User-Id'],
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.services.password');
						expect(res.body).to.have.nested.property('user.services.resume');
					})
					.end(done);
			});
		});

		it('should correctly route users that have `ufs` in their username', async () => {
			const ufsUsername = `ufs-${Date.now()}`;

			const user = await createUser({
				email: `me-${Date.now()}@email.com`,
				name: 'testuser',
				username: ufsUsername,
				password: '1234',
			});

			await request
				.get(api('users.info'))
				.set(credentials)
				.query({
					username: ufsUsername,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.user).to.have.property('type', 'user');
					expect(res.body.user).to.have.property('name', 'testuser');
					expect(res.body.user).to.have.property('username', ufsUsername);
					expect(res.body.user).to.have.property('active', true);
				});

			await deleteUser(user);
		});
	});
	describe('[/users.getPresence]', () => {
		it("should query a user's presence by userId", (done) => {
			void request
				.get(api('users.getPresence'))
				.set(credentials)
				.query({
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('presence', 'offline');
				})
				.end(done);
		});

		describe('Logging in with type: "resume"', () => {
			let user: TestUser<IUser>;
			let userCredentials: Credentials;

			before(async () => {
				user = await createUser({ joinDefaultChannels: false });
				userCredentials = await login(user.username, password);
			});

			after(() => deleteUser(user));

			it('should return "offline" after a login type "resume" via REST', async () => {
				await request
					.post(api('login'))
					.send({
						resume: userCredentials['X-Auth-Token'],
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				await request
					.get(api('users.getPresence'))
					.set(credentials)
					.query({
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('presence', 'offline');
					});
			});
		});
	});

	describe('[/users.presence]', () => {
		describe('Not logged in:', () => {
			it('should return 401 unauthorized', (done) => {
				void request
					.get(api('users.presence'))
					.expect('Content-Type', 'application/json')
					.expect(401)
					.expect((res) => {
						expect(res.body).to.have.property('message');
					})
					.end(done);
			});
		});
		describe('Logged in:', () => {
			it('should return online users full list', (done) => {
				void request
					.get(api('users.presence'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('full', true);

						const user = (res.body.users as IUser[]).find((user) => user.username === 'rocket.cat');

						expect(user).to.have.all.keys('_id', 'avatarETag', 'username', 'name', 'status', 'utcOffset');
					})
					.end(done);
			});

			it('should return no online users updated after now', (done) => {
				void request
					.get(api('users.presence'))
					.query({ from: new Date().toISOString() })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('full', false);
						expect(res.body).to.have.property('users').that.is.an('array').that.has.lengthOf(0);
					})
					.end(done);
			});

			it('should return full list of online users for more than 10 minutes in the past', (done) => {
				const date = new Date();
				date.setMinutes(date.getMinutes() - 11);

				void request
					.get(api('users.presence'))
					.query({ from: date.toISOString() })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('full', true);

						const user = (res.body.users as IUser[]).find((user) => user.username === 'rocket.cat');

						expect(user).to.have.all.keys('_id', 'avatarETag', 'username', 'name', 'status', 'utcOffset');
					})
					.end(done);
			});
		});
	});

	describe('[/users.list]', () => {
		let user: TestUser<IUser>;
		let deactivatedUser: TestUser<IUser>;
		let user2: TestUser<IUser>;
		let user2Credentials: Credentials;
		let user3: TestUser<IUser>;
		let user3Credentials: Credentials;
		let group: IRoom;
		let inviteToken: string;

		before(async () => {
			const username = `deactivated_${Date.now()}${apiUsername}`;
			const email = `deactivated_+${Date.now()}${apiEmail}`;

			const userData = {
				email,
				name: username,
				username,
				password,
				active: false,
			};

			deactivatedUser = await createUser(userData);

			expect(deactivatedUser).to.not.be.null;
			expect(deactivatedUser).to.have.nested.property('username', username);
			expect(deactivatedUser).to.have.nested.property('emails[0].address', email);
			expect(deactivatedUser).to.have.nested.property('active', false);
			expect(deactivatedUser).to.have.nested.property('name', username);
			expect(deactivatedUser).to.not.have.nested.property('e2e');
		});

		before(async () => {
			await setCustomFields({ customFieldText });

			const username = `customField_${Date.now()}${apiUsername}`;
			const email = `customField_+${Date.now()}${apiEmail}`;
			const customFields = { customFieldText: 'success' };

			const userData = {
				email,
				name: username,
				username,
				password,
				active: true,
				roles: ['user'],
				joinDefaultChannels: true,
				verified: true,
				customFields,
			};

			user = await createUser(userData);

			expect(user).to.not.be.null;
			expect(user).to.have.nested.property('username', username);
			expect(user).to.have.nested.property('emails[0].address', email);
			expect(user).to.have.nested.property('active', true);
			expect(user).to.have.nested.property('name', username);
			expect(user).to.have.nested.property('customFields.customFieldText', 'success');
			expect(user).to.not.have.nested.property('e2e');
		});

		before(async () => {
			user2 = await createUser({ joinDefaultChannels: false });
			user2Credentials = await login(user2.username, password);
			user3 = await createUser({ joinDefaultChannels: false });
			user3Credentials = await login(user3.username, password);
		});

		before('Create a group', async () => {
			group = (
				await createRoom({
					type: 'p',
					name: `group.test.${Date.now()}-${Math.random()}`,
				})
			).body.group;
		});

		before('Create invite link', async () => {
			inviteToken = (
				await request.post(api('findOrCreateInvite')).set(credentials).send({
					rid: group._id,
					days: 0,
					maxUses: 0,
				})
			).body._id;
		});

		after('Remove invite link', async () =>
			request
				.delete(api(`removeInvite/${inviteToken}`))
				.set(credentials)
				.send(),
		);

		after(() =>
			Promise.all([
				clearCustomFields(),
				deleteUser(deactivatedUser),
				deleteUser(user),
				deleteUser(user2),
				deleteUser(user3),
				deleteRoom({ type: 'p', roomId: group._id }),
				updatePermission('view-outside-room', ['admin', 'owner', 'moderator', 'user']),
				updateSetting('API_Apply_permission_view-outside-room_on_users-list', false),
			]),
		);

		it('should query all users in the system', (done) => {
			void request
				.get(api('users.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					const myself = (res.body.users as IUser[]).find((user) => user.username === adminUsername);
					expect(myself).to.not.have.property('e2e');
				})
				.end(done);
		});

		it('should sort for user statuses and check if deactivated user is correctly sorted', (done) => {
			const query = {
				fields: JSON.stringify({
					username: 1,
					_id: 1,
					active: 1,
					status: 1,
				}),
				sort: JSON.stringify({
					status: 1,
				}),
			};

			void request
				.get(api('users.list'))
				.query(query)
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('users');
					const firstUser = (res.body.users as IUser[]).find((u) => u._id === deactivatedUser._id);
					expect(firstUser).to.have.property('active', false);
				})
				.end(done);
		});

		it('should query all users in the system by name', (done) => {
			// filtering user list
			void request
				.get(api('users.list'))
				.set(credentials)
				.query({
					name: { $regex: 'g' },
					sort: JSON.stringify({
						createdAt: -1,
					}),
				})
				.field('username', 1)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('should query all users in the system when logged as normal user and `view-outside-room` not granted', async () => {
			await updatePermission('view-outside-room', ['admin']);
			await request
				.get(api('users.list'))
				.set(user2Credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				});
		});

		it('should not query users when logged as normal user, `view-outside-room` not granted and temp setting enabled', async () => {
			await updatePermission('view-outside-room', ['admin']);
			await updateSetting('API_Apply_permission_view-outside-room_on_users-list', true);

			await request.get(api('users.list')).set(user2Credentials).expect('Content-Type', 'application/json').expect(403);
		});

		it('should exclude inviteToken in the user item for privileged users', async () => {
			await request
				.post(api('useInviteToken'))
				.set(user2Credentials)
				.send({ token: inviteToken })
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room');
					expect(res.body.room).to.have.property('rid', group._id);
				});

			await request
				.get(api('users.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.query({
					fields: JSON.stringify({ inviteToken: 1 }),
					sort: JSON.stringify({ inviteToken: -1 }),
					count: 100,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					res.body.users.forEach((user: IUser) => {
						expect(user).to.not.have.property('inviteToken');
					});
				});
		});

		it('should exclude inviteToken in the user item for normal users', async () => {
			await updateSetting('API_Apply_permission_view-outside-room_on_users-list', false);
			await request
				.post(api('useInviteToken'))
				.set(user3Credentials)
				.send({ token: inviteToken })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room');
					expect(res.body.room).to.have.property('rid', group._id);
				});

			await request
				.get(api('users.list'))
				.set(user3Credentials)
				.expect('Content-Type', 'application/json')
				.query({
					fields: JSON.stringify({ inviteToken: 1 }),
					sort: JSON.stringify({ inviteToken: -1 }),
					count: 100,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					res.body.users.forEach((user: IUser) => {
						expect(user).to.not.have.property('inviteToken');
					});
				});
		});
	});

	describe('Avatars', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
			await Promise.all([
				updateSetting('Accounts_AllowUserAvatarChange', true),
				updatePermission('edit-other-user-avatar', ['admin', 'user']),
			]);
		});

		after(() =>
			Promise.all([
				updateSetting('Accounts_AllowUserAvatarChange', true),
				deleteUser(user),
				updatePermission('edit-other-user-avatar', ['admin']),
			]),
		);

		describe('[/users.setAvatar]', () => {
			it('should set the avatar of the logged user by a local image', (done) => {
				void request
					.post(api('users.setAvatar'))
					.set(userCredentials)
					.attach('image', imgURL)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it('should update the avatar of another user by userId when the logged user has the necessary permission (edit-other-user-avatar)', (done) => {
				void request
					.post(api('users.setAvatar'))
					.set(userCredentials)
					.attach('image', imgURL)
					.field({ userId: credentials['X-User-Id'] })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it('should set the avatar of another user by username and local image when the logged user has the necessary permission (edit-other-user-avatar)', (done) => {
				void request
					.post(api('users.setAvatar'))
					.set(credentials)
					.attach('image', imgURL)
					.field({ username: adminUsername })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it("should prevent from updating someone else's avatar when the logged user doesn't have the necessary permission(edit-other-user-avatar)", (done) => {
				void updatePermission('edit-other-user-avatar', []).then(() => {
					void request
						.post(api('users.setAvatar'))
						.set(userCredentials)
						.attach('image', imgURL)
						.field({ userId: credentials['X-User-Id'] })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
			it('should allow users with the edit-other-user-avatar permission to update avatars when the Accounts_AllowUserAvatarChange setting is off', (done) => {
				void updateSetting('Accounts_AllowUserAvatarChange', false).then(() => {
					void updatePermission('edit-other-user-avatar', ['admin']).then(() => {
						void request
							.post(api('users.setAvatar'))
							.set(credentials)
							.attach('image', imgURL)
							.field({ userId: userCredentials['X-User-Id'] })
							.expect('Content-Type', 'application/json')
							.expect(200)
							.expect((res) => {
								expect(res.body).to.have.property('success', true);
							})
							.end(done);
					});
				});
			});
			it('should prevent users from passing server-side request forgery (SSRF) payloads as avatarUrl', (done) => {
				void request
					.post(api('users.setAvatar'))
					.set(credentials)
					.send({
						userId: userCredentials['X-User-Id'],
						avatarUrl: 'http://169.254.169.254/',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		describe('[/users.resetAvatar]', () => {
			before(async () => {
				await Promise.all([
					updateSetting('Accounts_AllowUserAvatarChange', true),
					updatePermission('edit-other-user-avatar', ['admin', 'user']),
				]);
			});

			it('should set the avatar of the logged user by a local image', (done) => {
				void request
					.post(api('users.setAvatar'))
					.set(userCredentials)
					.attach('image', imgURL)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it('should reset the avatar of the logged user', (done) => {
				void request
					.post(api('users.resetAvatar'))
					.set(userCredentials)
					.expect('Content-Type', 'application/json')
					.send({
						userId: userCredentials['X-User-Id'],
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it('should reset the avatar of another user by userId when the logged user has the necessary permission (edit-other-user-avatar)', (done) => {
				void request
					.post(api('users.resetAvatar'))
					.set(userCredentials)
					.send({
						userId: credentials['X-User-Id'],
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it('should reset the avatar of another user by username and local image when the logged user has the necessary permission (edit-other-user-avatar)', (done) => {
				void request
					.post(api('users.resetAvatar'))
					.set(credentials)
					.send({
						username: adminUsername,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it("should prevent from resetting someone else's avatar when the logged user doesn't have the necessary permission(edit-other-user-avatar)", (done) => {
				void updatePermission('edit-other-user-avatar', []).then(() => {
					void request
						.post(api('users.resetAvatar'))
						.set(userCredentials)
						.send({
							userId: credentials['X-User-Id'],
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
			it('should allow users with the edit-other-user-avatar permission to reset avatars when the Accounts_AllowUserAvatarChange setting is off', (done) => {
				void updateSetting('Accounts_AllowUserAvatarChange', false).then(() => {
					void updatePermission('edit-other-user-avatar', ['admin']).then(() => {
						void request
							.post(api('users.resetAvatar'))
							.set(credentials)
							.send({
								userId: userCredentials['X-User-Id'],
							})
							.expect('Content-Type', 'application/json')
							.expect(200)
							.expect((res) => {
								expect(res.body).to.have.property('success', true);
							})
							.end(done);
					});
				});
			});
		});

		describe('[/users.getAvatar]', () => {
			it('should get the url of the avatar of the logged user via userId', (done) => {
				void request
					.get(api('users.getAvatar'))
					.set(userCredentials)
					.query({
						userId: userCredentials['X-User-Id'],
					})
					.expect(307)
					.end(done);
			});
			it('should get the url of the avatar of the logged user via username', (done) => {
				void request
					.get(api('users.getAvatar'))
					.set(userCredentials)
					.query({
						username: user.username,
					})
					.expect(307)
					.end(done);
			});
		});

		describe('[/users.getAvatarSuggestion]', () => {
			it('should return 401 unauthorized when user is not logged in', (done) => {
				void request.get(api('users.getAvatarSuggestion')).expect('Content-Type', 'application/json').expect(401).end(done);
			});

			it('should get avatar suggestion of the logged user via userId', (done) => {
				void request
					.get(api('users.getAvatarSuggestion'))
					.set(userCredentials)
					.query({
						userId: userCredentials['X-User-Id'],
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('suggestions').and.to.be.an('object');
					})
					.end(done);
			});
		});
	});

	describe('[/users.update]', () => {
		before(async () =>
			Promise.all([
				updateSetting('Accounts_AllowUserProfileChange', true),
				updateSetting('Accounts_AllowUsernameChange', true),
				updateSetting('Accounts_AllowRealNameChange', true),
				updateSetting('Accounts_AllowUserStatusMessageChange', true),
				updateSetting('Accounts_AllowEmailChange', true),
				updateSetting('Accounts_AllowPasswordChange', true),
				updatePermission('edit-other-user-info', ['admin']),
			]),
		);
		after(async () =>
			Promise.all([
				updateSetting('Accounts_AllowUserProfileChange', true),
				updateSetting('Accounts_AllowUsernameChange', true),
				updateSetting('Accounts_AllowRealNameChange', true),
				updateSetting('Accounts_AllowUserStatusMessageChange', true),
				updateSetting('Accounts_AllowEmailChange', true),
				updateSetting('Accounts_AllowPasswordChange', true),
				updatePermission('edit-other-user-info', ['admin']),
			]),
		);

		it("should update a user's info by userId", (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						email: apiEmail,
						name: `edited${apiUsername}`,
						username: `edited${apiUsername}`,
						password,
						active: true,
						roles: ['user'],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.username', `edited${apiUsername}`);
					expect(res.body).to.have.nested.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', `edited${apiUsername}`);
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});

		it("should update a user's email by userId", (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						email: `edited${apiEmail}`,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.emails[0].address', `edited${apiEmail}`);
					expect(res.body).to.have.nested.property('user.emails[0].verified', false);
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});

		it("should update a user's bio by userId", (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						bio: `edited-bio-test`,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.bio', 'edited-bio-test');
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});

		it("should update a user's nickname by userId", (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						nickname: `edited-nickname-test`,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.nickname', 'edited-nickname-test');
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});

		it(`should return an error when trying to set a nickname longer than ${MAX_NICKNAME_LENGTH} characters`, (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						nickname: Random.hexString(MAX_NICKNAME_LENGTH + 1),
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property(
						'error',
						`Nickname size exceeds ${MAX_NICKNAME_LENGTH} characters [error-nickname-size-exceeded]`,
					);
				})
				.end(done);
		});

		it(`should return an error when trying to set a bio longer than ${MAX_BIO_LENGTH} characters`, (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						bio: Random.hexString(MAX_BIO_LENGTH + 1),
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', `Bio size exceeds ${MAX_BIO_LENGTH} characters [error-bio-size-exceeded]`);
				})
				.end(done);
		});

		it('should return an error when trying to upsert a user by sending an empty userId', () => {
			return request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: '',
					data: {},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error', 'must NOT have fewer than 1 characters [invalid-params]');
				});
		});

		it('should return an error when trying to use the joinDefaultChannels param, which is not intended for updates', () => {
			return request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						joinDefaultChannels: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error', 'must NOT have additional properties [invalid-params]');
				});
		});

		it("should update a bot's email", (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: 'rocket.cat',
					data: { email: 'nouser@rocket.cat' },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it("should verify user's email by userId", (done) => {
			void request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						verified: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.emails[0].verified', true);
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});

		it('should return an error when trying update username and it is not allowed', (done) => {
			void updatePermission('edit-other-user-info', ['user']).then(() => {
				void updateSetting('Accounts_AllowUsernameChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								username: 'fake.name',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should update the user name when the required permission is applied', async () => {
			await Promise.all([updatePermission('edit-other-user-info', ['admin']), updateSetting('Accounts_AllowUsernameChange', false)]);

			await request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						username: `fake.name.${Date.now()}`,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return an error when trying update user real name and it is not allowed', (done) => {
			void updatePermission('edit-other-user-info', ['user']).then(() => {
				void updateSetting('Accounts_AllowRealNameChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								name: 'Fake name',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should update user real name when the required permission is applied', (done) => {
			void updatePermission('edit-other-user-info', ['admin']).then(() => {
				void updateSetting('Accounts_AllowRealNameChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								name: 'Fake name',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should return an error when trying update user status message and it is not allowed', (done) => {
			void updatePermission('edit-other-user-info', ['user']).then(() => {
				void updateSetting('Accounts_AllowUserStatusMessageChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								statusMessage: 'a new status',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should update user status message when the required permission is applied', (done) => {
			void updatePermission('edit-other-user-info', ['admin']).then(() => {
				void updateSetting('Accounts_AllowUserStatusMessageChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								name: 'a new status',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should return an error when trying update user email and it is not allowed', (done) => {
			void updatePermission('edit-other-user-info', ['user']).then(() => {
				void updateSetting('Accounts_AllowEmailChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								email: 'itsnotworking@email.com',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should update user email when the required permission is applied', (done) => {
			void updatePermission('edit-other-user-info', ['admin']).then(() => {
				void updateSetting('Accounts_AllowEmailChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								email: apiEmail,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should return an error when trying update user password and it is not allowed', (done) => {
			void updatePermission('edit-other-user-password', ['user']).then(() => {
				void updateSetting('Accounts_AllowPasswordChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								password: 'itsnotworking',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should update user password when the required permission is applied', (done) => {
			void updatePermission('edit-other-user-password', ['admin']).then(() => {
				void updateSetting('Accounts_AllowPasswordChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								password: 'itsnotworking',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should return an error when trying update profile and it is not allowed', (done) => {
			void updatePermission('edit-other-user-info', ['user']).then(() => {
				void updateSetting('Accounts_AllowUserProfileChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								verified: true,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should update profile when the required permission is applied', (done) => {
			void updatePermission('edit-other-user-info', ['admin']).then(() => {
				void updateSetting('Accounts_AllowUserProfileChange', false).then(() => {
					void request
						.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								verified: true,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should delete requirePasswordChangeReason when requirePasswordChange is set to false', async () => {
			const user = await createUser({
				requirePasswordChange: true,
			});

			await updateUserInDb(user._id, { requirePasswordChangeReason: 'any_data' });

			await request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId: user._id,
					data: {
						requirePasswordChange: false,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('user');
					expect(res.body.user).to.have.property('requirePasswordChange', false);
					expect(res.body.user).to.not.have.property('requirePasswordChangeReason');
				});

			await deleteUser(user);
		});

		describe('email verification', () => {
			let admin: TestUser<IUser>;
			let userToUpdate: TestUser<IUser>;
			let userCredentials: Credentials;

			beforeEach(async () => {
				admin = await createUser({ roles: ['admin'] });
				userToUpdate = await createUser();
				userCredentials = await login(admin.username, password);
			});

			afterEach(async () => {
				await deleteUser(userToUpdate);
				await deleteUser(admin);
			});

			it("should update user's email verified correctly", async () => {
				await request
					.post(api('users.update'))
					.set(userCredentials)
					.send({
						userId: userToUpdate._id,
						data: {
							verified: true,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.emails[0].verified', true);
						expect(res.body).to.not.have.nested.property('user.e2e');
					});
			});

			it("should update user's email verified even if email is not changed", (done) => {
				void request
					.post(api('users.update'))
					.set(userCredentials)
					.send({
						userId: userToUpdate._id,
						data: {
							email: userToUpdate.emails[0].address,
							verified: true,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.emails[0].verified', true);
						expect(res.body).to.not.have.nested.property('user.e2e');
					})
					.end(done);
			});
		});

		function failUpdateUser(name: string) {
			it(`should not update an user if the new username is the reserved word ${name}`, (done) => {
				void request
					.post(api('users.update'))
					.set(credentials)
					.send({
						userId: targetUser._id,
						data: {
							username: name,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Could not save user identity [error-could-not-save-identity]');
					})
					.end(done);
			});
		}

		reservedWords.forEach((name) => {
			failUpdateUser(name);
		});
	});

	describe('[/users.updateOwnBasicInfo]', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(() =>
			Promise.all([
				deleteUser(user),
				updateSetting('E2E_Enable', false),
				updateSetting('Accounts_AllowRealNameChange', true),
				updateSetting('Accounts_AllowUsernameChange', true),
				updateSetting('Accounts_AllowUserStatusMessageChange', true),
				updateSetting('Accounts_AllowEmailChange', true),
				updateSetting('Accounts_AllowPasswordChange', true),
			]),
		);

		const newPassword = `${password}test`;
		const currentPassword = crypto.createHash('sha256').update(password, 'utf8').digest('hex');
		const editedUsername = `basicInfo.name${+new Date()}`;
		const editedName = `basic-info-test-name${+new Date()}`;
		const editedEmail = `test${+new Date()}@mail.com`;

		it('enabling E2E in server and generating keys to user...', (done) => {
			void updateSetting('E2E_Enable', true).then(() => {
				void request
					.post(api('e2e.setUserPublicAndPrivateKeys'))
					.set(userCredentials)
					.send({
						private_key: 'test',
						public_key: 'test',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});

		it('should update the user own basic information', (done) => {
			void request
				.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						name: editedName,
						username: editedUsername,
						currentPassword,
						newPassword,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { user } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(user.username).to.be.equal(editedUsername);
					expect(user.name).to.be.equal(editedName);
					expect(user).to.not.have.property('e2e');
				})
				.end(done);
		});

		it('should update the user name only', (done) => {
			void request
				.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						username: editedUsername,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { user } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(user.username).to.be.equal(editedUsername);
					expect(user).to.not.have.property('e2e');
				})
				.end(done);
		});

		it('should throw an error when user try change email without the password', (done) => {
			void request
				.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						email: editedEmail,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.end(done);
		});

		it('should throw an error when user try change password without the actual password', (done) => {
			void request
				.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						newPassword: 'the new pass',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.end(done);
		});

		it('should throw an error when the name is only whitespaces', (done) => {
			void request
				.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						name: '  ',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it("should set new email as 'unverified'", (done) => {
			void request
				.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						email: editedEmail,
						currentPassword: crypto.createHash('sha256').update(newPassword, 'utf8').digest('hex'),
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { user } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(user.emails[0].address).to.be.equal(editedEmail);
					expect(user.emails[0].verified).to.be.false;
					expect(user).to.not.have.property('e2e');
				})
				.end(done);
		});

		function failUpdateUserOwnBasicInfo(name: string) {
			it(`should not update an user's basic info if the new username is the reserved word ${name}`, (done) => {
				void request
					.post(api('users.updateOwnBasicInfo'))
					.set(credentials)
					.send({
						data: {
							username: name,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Could not save user identity [error-could-not-save-identity]');
					})
					.end(done);
			});
		}

		reservedWords.forEach((name) => {
			failUpdateUserOwnBasicInfo(name);
		});

		it('should throw an error if not allowed to change real name', async () => {
			await updateSetting('Accounts_AllowRealNameChange', false);

			await request
				.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						name: 'edited name',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should throw an error if not allowed to change username', async () => {
			await updateSetting('Accounts_AllowUsernameChange', false);

			await request
				.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						username: 'edited.user.name',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should throw an error if not allowed to change statusText', async () => {
			await updateSetting('Accounts_AllowUserStatusMessageChange', false);

			await request
				.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						statusText: 'My custom status',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should throw an error if not allowed to change email', async () => {
			await updateSetting('Accounts_AllowEmailChange', false);

			await request
				.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						email: 'changed@email.com',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should throw an error if not allowed to change password', async () => {
			await updateSetting('Accounts_AllowPasswordChange', false);

			await request
				.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						newPassword: 'MyNewPassw0rd',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		describe('[Password Policy]', () => {
			before(async () => {
				await updateSetting('Accounts_AllowPasswordChange', true);
				await updateSetting('Accounts_Password_Policy_Enabled', true);
				await updateSetting('Accounts_TwoFactorAuthentication_Enabled', false);
			});

			after(async () => {
				await updateSetting('Accounts_AllowPasswordChange', true);
				await updateSetting('Accounts_Password_Policy_Enabled', false);
				await updateSetting('Accounts_TwoFactorAuthentication_Enabled', true);
			});

			it('should throw an error if the password length is less than the minimum length', async () => {
				const expectedError = {
					error: 'error-password-policy-not-met-minLength',
					message: 'The password does not meet the minimum length password policy.',
				};

				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: '2',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.errorType).to.be.equal('error-password-policy-not-met');
						expect(res.body.details).to.be.an('array').that.deep.includes(expectedError);
					})
					.expect(400);
			});

			it('should throw an error if the password length is greater than the maximum length', async () => {
				await updateSetting('Accounts_Password_Policy_MaxLength', 5);

				const expectedError = {
					error: 'error-password-policy-not-met-maxLength',
					message: 'The password does not meet the maximum length password policy.',
				};

				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: 'Abc@12345678',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.errorType).to.be.equal('error-password-policy-not-met');
						expect(res.body.details).to.be.an('array').that.deep.includes(expectedError);
					})
					.expect(400);
			});

			it('should throw an error if the password contains repeating characters', async () => {
				const expectedError = {
					error: 'error-password-policy-not-met-repeatingCharacters',
					message: 'The password contains repeating characters which is against the password policy.',
				};

				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: 'A@123aaaa',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.errorType).to.be.equal('error-password-policy-not-met');
						expect(res.body.details).to.be.an('array').that.deep.includes(expectedError);
					})
					.expect(400);
			});

			it('should throw an error if the password does not contain at least one lowercase character', async () => {
				const expectedError = {
					error: 'error-password-policy-not-met-oneLowercase',
					message: 'The password does not contain at least one lowercase character which is against the password policy.',
				};

				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: 'PASSWORD@123',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.errorType).to.be.equal('error-password-policy-not-met');
						expect(res.body.details).to.be.an('array').that.deep.includes(expectedError);
					})
					.expect(400);
			});

			it('should throw an error if the password does not contain at least one uppercase character', async () => {
				const expectedError = {
					error: 'error-password-policy-not-met-oneUppercase',
					message: 'The password does not contain at least one uppercase character which is against the password policy.',
				};

				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: 'password@123',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.errorType).to.be.equal('error-password-policy-not-met');
						expect(res.body.details).to.be.an('array').that.deep.includes(expectedError);
					})
					.expect(400);
			});

			it('should throw an error if the password does not contain at least one numerical character', async () => {
				const expectedError = {
					error: 'error-password-policy-not-met-oneNumber',
					message: 'The password does not contain at least one numerical character which is against the password policy.',
				};

				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: 'Password@',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.errorType).to.be.equal('error-password-policy-not-met');
						expect(res.body.details).to.be.an('array').that.deep.includes(expectedError);
					})
					.expect(400);
			});

			it('should throw an error if the password does not contain at least one special character', async () => {
				const expectedError = {
					error: 'error-password-policy-not-met-oneSpecial',
					message: 'The password does not contain at least one special character which is against the password policy.',
				};

				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: 'Password123',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.errorType).to.be.equal('error-password-policy-not-met');
						expect(res.body.details).to.be.an('array').that.deep.includes(expectedError);
					})
					.expect(400);
			});

			it('should be able to update if the password meets all the validation rules', async () => {
				await updateSetting('Accounts_Password_Policy_MaxLength', -1);
				await request
					.post(api('users.updateOwnBasicInfo'))
					.set(userCredentials)
					.send({
						data: {
							currentPassword,
							newPassword: '123Abc@!',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('user');
					})
					.expect(200);
			});
		});
	});

	// TODO check for all response fields
	describe('[/users.setPreferences]', () => {
		after(() => updatePermission('edit-other-user-info', ['admin']));

		it('should return an error when the user try to update info of another user and does not have the necessary permission', (done) => {
			const userPreferences = {
				userId: 'rocket.cat',
				data: {
					...preferences.data,
				},
			};
			void updatePermission('edit-other-user-info', []).then(() => {
				void request
					.post(api('users.setPreferences'))
					.set(credentials)
					.send(userPreferences)
					.expect(400)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Editing user is not allowed [error-action-not-allowed]');
						expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
					})
					.end(done);
			});
		});
		it('should return an error when the user try to update info of an nonexistent user', (done) => {
			const userPreferences = {
				userId: 'invalid-id',
				data: {
					...preferences.data,
				},
			};
			void updatePermission('edit-other-user-info', ['admin', 'user']).then(() => {
				void request
					.post(api('users.setPreferences'))
					.set(credentials)
					.send(userPreferences)
					.expect(400)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property(
							'error',
							'The optional "userId" param provided does not match any users [error-invalid-user]',
						);
						expect(res.body).to.have.property('errorType', 'error-invalid-user');
					})
					.end(done);
			});
		});
		it('should set some preferences of another user successfully', (done) => {
			const userPreferences = {
				userId: 'rocket.cat',
				data: {
					...preferences.data,
				},
			};
			void updatePermission('edit-other-user-info', ['admin', 'user']).then(() => {
				void request
					.post(api('users.setPreferences'))
					.set(credentials)
					.send(userPreferences)
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body.user).to.have.property('settings');
						expect(res.body.user.settings).to.have.property('preferences');
						expect(res.body.user._id).to.be.equal('rocket.cat');
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
		it('should set some preferences by user when execute successfully', (done) => {
			const userPreferences = {
				userId: credentials['X-User-Id'],
				data: {
					...preferences.data,
				},
			};
			void request
				.post(api('users.setPreferences'))
				.set(credentials)
				.send(userPreferences)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body.user).to.have.property('settings');
					expect(res.body.user.settings).to.have.property('preferences');
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should set some preferences and language preference by user when execute successfully', (done) => {
			const userPreferences = {
				userId: credentials['X-User-Id'],
				data: {
					...preferences.data,
					language: 'en',
				},
			};
			void request
				.post(api('users.setPreferences'))
				.set(credentials)
				.send(userPreferences)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.user.settings.preferences).to.have.property('language', 'en');
				})
				.end(done);
		});
	});

	describe('[/users.getPreferences]', () => {
		it('should return all preferences when execute successfully', (done) => {
			const userPreferences = {
				...preferences.data,
				language: 'en',
			};
			void request
				.get(api('users.getPreferences'))
				.set(credentials)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body.preferences).to.be.eql(userPreferences);
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/users.forgotPassword]', () => {
		it('should return an error when "Accounts_PasswordReset" is disabled', (done) => {
			void updateSetting('Accounts_PasswordReset', false).then(() => {
				void request
					.post(api('users.forgotPassword'))
					.send({
						email: adminEmail,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Password reset is not enabled');
					})
					.end(done);
			});
		});

		it('should send email to user (return success), when is a valid email', (done) => {
			void updateSetting('Accounts_PasswordReset', true).then(() => {
				void request
					.post(api('users.forgotPassword'))
					.send({
						email: adminEmail,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});

		it('should not send email to user(return error), when is a invalid email', (done) => {
			void request
				.post(api('users.forgotPassword'))
				.send({
					email: 'invalidEmail',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/users.sendConfirmationEmail]', () => {
		it('should send email to user (return success), when is a valid email', (done) => {
			void request
				.post(api('users.sendConfirmationEmail'))
				.set(credentials)
				.send({
					email: adminEmail,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should not send email to user(return error), when is a invalid email', (done) => {
			void request
				.post(api('users.sendConfirmationEmail'))
				.set(credentials)
				.send({
					email: 'invalidEmail',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('[/users.getUsernameSuggestion]', () => {
		const testUsername = `test${+new Date()}`;
		let targetUser: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			targetUser = await registerUser({
				email: `${testUsername}.@test.com`,
				username: `${testUsername}test`,
				name: testUsername,
				pass: password,
			});
			userCredentials = await login(targetUser.username, password);
		});

		after(() => deleteUser(targetUser));

		it('should return an username suggestion', (done) => {
			void request
				.get(api('users.getUsernameSuggestion'))
				.set(userCredentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.exist;
				})
				.end(done);
		});
	});

	describe('[/users.checkUsernameAvailability]', () => {
		let targetUser: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			targetUser = await registerUser();
			userCredentials = await login(targetUser.username, password);
		});

		after(() => deleteUser(targetUser));

		it('should return 401 unauthorized when user is not logged in', (done) => {
			void request
				.get(api('users.checkUsernameAvailability'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return true if the username is the same user username set', (done) => {
			void request
				.get(api('users.checkUsernameAvailability'))
				.set(userCredentials)
				.query({
					username: targetUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.result).to.be.equal(true);
				})
				.end(done);
		});

		it('should return true if the username is available', (done) => {
			void request
				.get(api('users.checkUsernameAvailability'))
				.set(userCredentials)
				.query({
					username: `${targetUser.username}-${+new Date()}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.result).to.be.equal(true);
				})
				.end(done);
		});

		it('should return an error when the username is invalid', (done) => {
			void request
				.get(api('users.checkUsernameAvailability'))
				.set(userCredentials)
				.query({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('[/users.deleteOwnAccount]', () => {
		let targetUser: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			targetUser = await registerUser();
			userCredentials = await login(targetUser.username, password);
		});

		after(async () => deleteUser(targetUser));

		it('Enable "Accounts_AllowDeleteOwnAccount" setting...', (done) => {
			void request
				.post('/api/v1/settings/Accounts_AllowDeleteOwnAccount')
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(wait(done, 200));
		});

		it('should delete user own account', (done) => {
			void request
				.post(api('users.deleteOwnAccount'))
				.set(userCredentials)
				.send({
					password: crypto.createHash('sha256').update(password, 'utf8').digest('hex'),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should delete user own account when the SHA256 hash is in upper case', async () => {
			const user = await createUser();
			const createdUserCredentials = await login(user.username, password);
			await request
				.post(api('users.deleteOwnAccount'))
				.set(createdUserCredentials)
				.send({
					password: crypto.createHash('sha256').update(password, 'utf8').digest('hex').toUpperCase(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await deleteUser(user);
		});

		describe('last owner cases', () => {
			let user: TestUser<IUser>;
			let createdUserCredentials: Credentials;
			let room: IRoom;

			beforeEach(async () => {
				user = await createUser();
				createdUserCredentials = await login(user.username, password);
				room = (
					await createRoom({
						type: 'c',
						name: `channel.test.${Date.now()}-${Math.random()}`,
						username: user.username,
						members: [user.username],
					})
				).body.channel;
				await addRoomOwner({ type: 'c', roomId: room._id, userId: user._id });
				await removeRoomOwner({ type: 'c', roomId: room._id, userId: credentials['X-User-Id'] });
			});

			afterEach(async () => {
				await deleteRoom({ type: 'c', roomId: room._id });
				await deleteUser(user);
			});

			it('should return an error when trying to delete user own account if user is the last room owner', async () => {
				await request
					.post(api('users.deleteOwnAccount'))
					.set(createdUserCredentials)
					.send({
						password: crypto.createHash('sha256').update(password, 'utf8').digest('hex'),
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', '[user-last-owner]');
						expect(res.body).to.have.property('errorType', 'user-last-owner');
					});
			});

			it('should delete user own account if the user is the last room owner and `confirmRelinquish` is set to `true`', async () => {
				await request
					.post(api('users.deleteOwnAccount'))
					.set(createdUserCredentials)
					.send({
						password: crypto.createHash('sha256').update(password, 'utf8').digest('hex'),
						confirmRelinquish: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});

			it('should assign a new owner to the room if the last room owner is deleted', async () => {
				await request
					.post(api('users.deleteOwnAccount'))
					.set(createdUserCredentials)
					.send({
						password: crypto.createHash('sha256').update(password, 'utf8').digest('hex'),
						confirmRelinquish: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				const roles = await getChannelRoles({ roomId: room._id });

				expect(roles).to.have.lengthOf(1);
				expect(roles[0].roles).to.eql(['owner']);
				expect(roles[0].u).to.have.property('_id', credentials['X-User-Id']);
			});
		});
	});

	describe('[/users.delete]', () => {
		let newUser: TestUser<IUser>;

		before(async () => {
			newUser = await createUser();
		});

		after(async () => {
			await deleteUser(newUser);
			await updatePermission('delete-user', ['admin']);
		});

		it('should return an error when trying delete user account without "delete-user" permission', async () => {
			await updatePermission('delete-user', ['user']);
			await request
				.post(api('users.delete'))
				.set(credentials)
				.send({
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should delete user account when logged user has "delete-user" permission', async () => {
			await updatePermission('delete-user', ['admin']);
			await request
				.post(api('users.delete'))
				.set(credentials)
				.send({
					userId: newUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		describe('last owner cases', () => {
			let targetUser: TestUser<IUser>;
			let room: IRoom;
			beforeEach(async () => {
				targetUser = await registerUser();
				room = (
					await createRoom({
						type: 'c',
						name: `channel.test.${Date.now()}-${Math.random()}`,
						members: [targetUser.username],
					})
				).body.channel;
				await addRoomOwner({ type: 'c', roomId: room._id, userId: targetUser._id });
				await removeRoomOwner({ type: 'c', roomId: room._id, userId: credentials['X-User-Id'] });
			});

			afterEach(() => Promise.all([deleteRoom({ type: 'c', roomId: room._id }), deleteUser(targetUser, { confirmRelinquish: true })]));

			it('should return an error when trying to delete user account if the user is the last room owner', async () => {
				await updatePermission('delete-user', ['admin']);
				await request
					.post(api('users.delete'))
					.set(credentials)
					.send({
						userId: targetUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', '[user-last-owner]');
						expect(res.body).to.have.property('errorType', 'user-last-owner');
					});
			});

			it('should delete user account if the user is the last room owner and `confirmRelinquish` is set to `true`', async () => {
				await updatePermission('delete-user', ['admin']);
				await request
					.post(api('users.delete'))
					.set(credentials)
					.send({
						userId: targetUser._id,
						confirmRelinquish: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});

			it('should assign a new owner to the room if the last room owner is deleted', async () => {
				await updatePermission('delete-user', ['admin']);

				await request
					.post(api('users.delete'))
					.set(credentials)
					.send({
						userId: targetUser._id,
						confirmRelinquish: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				const roles = await getChannelRoles({ roomId: room._id });

				expect(roles).to.have.lengthOf(1);
				expect(roles[0].roles).to.eql(['owner']);
				expect(roles[0].u).to.have.property('_id', credentials['X-User-Id']);
			});
		});
	});

	describe('Personal Access Tokens', () => {
		const tokenName = `${Date.now()}token`;
		describe('successful cases', () => {
			before(() => updatePermission('create-personal-access-tokens', ['admin']));
			after(() => updatePermission('create-personal-access-tokens', ['admin']));

			describe('[/users.getPersonalAccessTokens]', () => {
				it('should return an array when the user does not have personal tokens configured', (done) => {
					void request
						.get(api('users.getPersonalAccessTokens'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('tokens').and.to.be.an('array');
						})
						.end(done);
				});
			});

			describe('[/users.generatePersonalAccessToken]', () => {
				it('should return a personal access token to user', (done) => {
					void request
						.post(api('users.generatePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('token');
						})
						.end(done);
				});
				it('should throw an error when user tries generate a token with the same name', (done) => {
					void request
						.post(api('users.generatePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
			describe('[/users.regeneratePersonalAccessToken]', () => {
				it('should return a personal access token to user when user regenerates the token', (done) => {
					void request
						.post(api('users.regeneratePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('token');
						})
						.end(done);
				});
				it('should throw an error when user tries regenerate a token that does not exist', (done) => {
					void request
						.post(api('users.regeneratePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName: 'tokenthatdoesnotexist',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
			describe('[/users.getPersonalAccessTokens]', () => {
				it('should return my personal access tokens', (done) => {
					void request
						.get(api('users.getPersonalAccessTokens'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('tokens').and.to.be.an('array');
						})
						.end(done);
				});
			});
			describe('[/users.removePersonalAccessToken]', () => {
				it('should return success when user remove a personal access token', (done) => {
					void request
						.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
				it('should throw an error when user tries remove a token that does not exist', (done) => {
					void request
						.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName: 'tokenthatdoesnotexist',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});
		describe('unsuccessful cases', () => {
			before(() => updatePermission('create-personal-access-tokens', []));
			after(() => updatePermission('create-personal-access-tokens', ['admin']));

			describe('should return an error when the user dont have the necessary permission "create-personal-access-tokens"', () => {
				it('/users.generatePersonalAccessToken', (done) => {
					void request
						.post(api('users.generatePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('not-authorized');
						})
						.end(done);
				});
				it('/users.regeneratePersonalAccessToken', (done) => {
					void request
						.post(api('users.regeneratePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('not-authorized');
						})
						.end(done);
				});
				it('/users.getPersonalAccessTokens', (done) => {
					void request
						.get(api('users.getPersonalAccessTokens'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
						})
						.end(done);
				});
				it('/users.removePersonalAccessToken', (done) => {
					void request
						.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('not-authorized');
						})
						.end(done);
				});
				it('should throw an error when user tries remove a token that does not exist', (done) => {
					void request
						.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName: 'tokenthatdoesnotexist',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('not-authorized');
						})
						.end(done);
				});
			});
		});
	});

	describe('[/users.setActiveStatus]', () => {
		let user: TestUser<IUser>;
		let agent: IUserWithCredentials;
		let agentUser: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			agentUser = await createUser();
			const agentUserCredentials = await login(agentUser.username, password);
			await createAgent(agentUser.username);
			await makeAgentAvailable(agentUserCredentials);

			agent = {
				user: agentUser,
				credentials: agentUserCredentials,
			};
		});

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
			await Promise.all([
				updatePermission('edit-other-user-active-status', ['admin', 'user']),
				updatePermission('manage-moderation-actions', ['admin']),
			]);
		});

		after(() =>
			Promise.all([
				deleteUser(user),
				updatePermission('edit-other-user-active-status', ['admin']),
				updatePermission('manage-moderation-actions', ['admin']),
			]),
		);

		after(() => Promise.all([removeAgent(agent.user._id), deleteUser(agent.user)]));

		it('should set other user active status to false when the logged user has the necessary permission(edit-other-user-active-status)', (done) => {
			void request
				.post(api('users.setActiveStatus'))
				.set(userCredentials)
				.send({
					activeStatus: false,
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.active', false);
				})
				.end(done);
		});
		it('should set other user active status to true when the logged user has the necessary permission(edit-other-user-active-status)', (done) => {
			void request
				.post(api('users.setActiveStatus'))
				.set(userCredentials)
				.send({
					activeStatus: true,
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.active', true);
				})
				.end(done);
		});

		it('should return an error when trying to set other user active status and has not the necessary permission(edit-other-user-active-status)', (done) => {
			void updatePermission('edit-other-user-active-status', []).then(() => {
				void request
					.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: false,
						userId: targetUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
					})
					.end(done);
			});
		});
		it('should return an error when trying to set user own active status and has not the necessary permission(edit-other-user-active-status)', (done) => {
			void request
				.post(api('users.setActiveStatus'))
				.set(userCredentials)
				.send({
					activeStatus: false,
					userId: user._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				})
				.end(done);
		});
		it('should set user own active status to false when the user has the necessary permission(edit-other-user-active-status)', (done) => {
			void updatePermission('edit-other-user-active-status', ['admin']).then(() => {
				void request
					.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: false,
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
					})
					.end(done);
			});
		});
		it('users should retain their roles when they are deactivated', async () => {
			const testUser = await createUser({ roles: ['user', 'livechat-agent'] });

			await request
				.post(api('users.setActiveStatus'))
				.set(credentials)
				.send({
					activeStatus: false,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const user = await getUserByUsername(testUser.username);
			expect(user).to.have.property('roles');
			expect(user.roles).to.be.an('array').of.length(2);
			expect(user.roles).to.include('user', 'livechat-agent');

			await deleteUser(testUser);
		});

		it('should make agents not-available when the user is deactivated', async () => {
			await makeAgentAvailable(agent.credentials);
			await request
				.post(api('users.setActiveStatus'))
				.set(credentials)
				.send({
					activeStatus: false,
					userId: agent.user._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const agentInfo = await getAgent(agent.user._id);
			expect(agentInfo).to.have.property('statusLivechat', 'not-available');
		});

		it('should not make agents available when the user is activated', async () => {
			let agentInfo = await getAgent(agent.user._id);
			expect(agentInfo).to.have.property('statusLivechat', 'not-available');

			await request
				.post(api('users.setActiveStatus'))
				.set(credentials)
				.send({
					activeStatus: true,
					userId: agent.user._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			agentInfo = await getAgent(agent.user._id);
			expect(agentInfo).to.have.property('statusLivechat', 'not-available');
		});

		describe('last owner cases', () => {
			let room: IRoom;

			beforeEach(() =>
				Promise.all([
					updatePermission('edit-other-user-active-status', ['admin', 'user']),
					updatePermission('manage-moderation-actions', ['admin', 'user']),
				]),
			);

			afterEach(() => deleteRoom({ type: 'c', roomId: room._id }));

			it('should return an error when trying to set other user status to inactive and the user is the last owner of a room', async () => {
				room = (
					await createRoom({
						type: 'c',
						name: `channel.test.${Date.now()}-${Math.random()}`,
						username: targetUser.username,
						members: [targetUser.username],
					})
				).body.channel;

				await inviteToChannel({ userId: targetUser._id, roomId: room._id });
				await addRoomOwner({ type: 'c', userId: targetUser._id, roomId: room._id });
				await removeRoomOwner({ type: 'c', userId: credentials['X-User-Id'], roomId: room._id });

				await request
					.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: false,
						userId: targetUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', '[user-last-owner]');
						expect(res.body).to.have.property('errorType', 'user-last-owner');
					});
			});

			it('should set other user status to inactive if the user is the last owner of a room and `confirmRelinquish` is set to `true`', async () => {
				room = (
					await createRoom({
						type: 'c',
						name: `channel.test.${Date.now()}-${Math.random()}`,
						username: targetUser.username,
						members: [targetUser.username],
					})
				).body.channel;

				await inviteToChannel({ userId: targetUser._id, roomId: room._id });
				await addRoomOwner({ type: 'c', userId: targetUser._id, roomId: room._id });
				await removeRoomOwner({ type: 'c', userId: credentials['X-User-Id'], roomId: room._id });

				await request
					.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: false,
						userId: targetUser._id,
						confirmRelinquish: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});

			it('should set other user as room owner if the last owner of a room is deactivated and `confirmRelinquish` is set to `true`', async () => {
				room = (
					await createRoom({
						type: 'c',
						name: `channel.test.${Date.now()}-${Math.random()}`,
						members: [targetUser.username],
					})
				).body.channel;

				await request
					.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: true,
						userId: targetUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
				await inviteToChannel({ userId: targetUser._id, roomId: room._id });
				await addRoomOwner({ type: 'c', userId: targetUser._id, roomId: room._id });
				await removeRoomOwner({ type: 'c', userId: credentials['X-User-Id'], roomId: room._id });

				await request
					.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: false,
						userId: targetUser._id,
						confirmRelinquish: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});

				const roles = await getChannelRoles({ roomId: room._id });

				expect(roles).to.have.lengthOf(2);
				const originalCreator = roles.find((role) => role.u._id === credentials['X-User-Id']);
				assert.isDefined(originalCreator);
				expect(originalCreator.roles).to.eql(['owner']);
				expect(originalCreator.u).to.have.property('_id', credentials['X-User-Id']);
			});
		});
	});

	describe('[/users.deactivateIdle]', () => {
		let testUser: TestUser<IUser>;
		const testRoleId = 'guest';

		before('Create test user', async () => {
			testUser = await createUser();
			await request
				.post(api('roles.addUserToRole'))
				.set(credentials)
				.send({
					roleId: testRoleId,
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		after(() => Promise.all([deleteUser(testUser), updatePermission('edit-other-user-active-status', ['admin'])]));

		it('should fail to deactivate if user doesnt have edit-other-user-active-status permission', (done) => {
			void updatePermission('edit-other-user-active-status', []).then(() => {
				void request
					.post(api('users.deactivateIdle'))
					.set(credentials)
					.send({
						daysIdle: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
					})
					.end(done);
			});
		});
		it('should deactivate no users when no users in time range', (done) => {
			void updatePermission('edit-other-user-active-status', ['admin']).then(() => {
				void request
					.post(api('users.deactivateIdle'))
					.set(credentials)
					.send({
						daysIdle: 999999,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('count', 0);
					})
					.end(done);
			});
		});
		it('should deactivate the test user when given its role and daysIdle = 0', (done) => {
			void updatePermission('edit-other-user-active-status', ['admin']).then(() => {
				void request
					.post(api('users.deactivateIdle'))
					.set(credentials)
					.send({
						daysIdle: 0,
						role: testRoleId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('count', 1);
					})
					.end(done);
			});
		});
		it('should not deactivate the test user again when given its role and daysIdle = 0', (done) => {
			void updatePermission('edit-other-user-active-status', ['admin']).then(() => {
				void request
					.post(api('users.deactivateIdle'))
					.set(credentials)
					.send({
						daysIdle: 0,
						role: testRoleId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('count', 0);
					})
					.end(done);
			});
		});
	});

	describe('[/users.requestDataDownload]', () => {
		it('should return the request data with fullExport false when no query parameter was send', (done) => {
			void request
				.get(api('users.requestDataDownload'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('requested');
					expect(res.body).to.have.property('exportOperation').and.to.be.an('object');
					expect(res.body.exportOperation).to.have.property('fullExport', false);
				})
				.end(done);
		});
		it('should return the request data with fullExport false when the fullExport query parameter is false', (done) => {
			void request
				.get(api('users.requestDataDownload'))
				.query({ fullExport: 'false' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('requested');
					expect(res.body).to.have.property('exportOperation').and.to.be.an('object');
					expect(res.body.exportOperation).to.have.property('fullExport', false);
				})
				.end(done);
		});
		it('should return the request data with fullExport true when the fullExport query parameter is true', (done) => {
			void request
				.get(api('users.requestDataDownload'))
				.query({ fullExport: 'true' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('requested');
					expect(res.body).to.have.property('exportOperation').and.to.be.an('object');
					expect(res.body.exportOperation).to.have.property('fullExport', true);
				})
				.end(done);
		});
	});

	describe('[/users.logoutOtherClients]', function () {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;
		let newCredentials: Credentials;

		this.timeout(20000);

		before(async () => {
			user = await createUser({ joinDefaultChannels: false });
			userCredentials = await login(user.username, password);
			newCredentials = await login(user.username, password);
		});
		after(() => deleteUser(user));

		it('should invalidate all active sesions', (done) => {
			/* We want to validate that the login with the "old" credentials fails
				However, the removal of the tokens is done asynchronously.
				Thus, we check that within the next seconds, at least one try to
				access an authentication requiring route fails */
			let counter = 0;

			async function checkAuthenticationFails() {
				const result = await request.get(api('me')).set(userCredentials);
				return result.statusCode === 401;
			}

			async function tryAuthentication() {
				if (await checkAuthenticationFails()) {
					done();
				} else if (++counter < 20) {
					setTimeout(tryAuthentication, 1000);
				} else {
					done('Session did not invalidate in time');
				}
			}

			void request
				.post(api('users.logoutOtherClients'))
				.set(newCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('token').and.to.be.a('string');
					expect(res.body).to.have.property('tokenExpires').and.to.be.a('string');
				})
				.then(tryAuthentication);
		});
	});

	describe('[/users.autocomplete]', () => {
		after(() => updatePermission('view-outside-room', ['admin', 'owner', 'moderator', 'user']));

		describe('[without permission]', function () {
			let user: TestUser<IUser>;
			let userCredentials: Credentials;
			let user2: TestUser<IUser>;
			let user2Credentials: Credentials;
			let roomId: IRoom['_id'];

			this.timeout(20000);

			before(async () => {
				user = await createUser({ joinDefaultChannels: false });
				user2 = await createUser({ joinDefaultChannels: false });

				userCredentials = await login(user.username, password);
				user2Credentials = await login(user2.username, password);

				await updatePermission('view-outside-room', []);

				roomId = (await createRoom({ type: 'c', credentials: userCredentials, name: `channel.autocomplete.${Date.now()}` })).body.channel
					._id;
			});

			after(async () => {
				await deleteRoom({ type: 'c', roomId });
				await Promise.all([deleteUser(user), deleteUser(user2)]);
			});

			it('should return an empty list when the user does not have any subscription', (done) => {
				void request
					.get(api('users.autocomplete'))
					.query({ selector: '{}' })
					.set(userCredentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('items').and.to.be.an('array').that.has.lengthOf(0);
					})
					.end(done);
			});

			it('should return users that are subscribed to the same rooms as the requester', async () => {
				await joinChannel({ overrideCredentials: user2Credentials, roomId });

				void request
					.get(api('users.autocomplete'))
					.query({ selector: '{}' })
					.set(userCredentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('items').and.to.be.an('array').with.lengthOf(1);
					});
			});
		});

		describe('[with permission]', () => {
			before(() => updatePermission('view-outside-room', ['admin', 'user']));

			it('should return an error when the required parameter "selector" is not provided', () => {
				void request
					.get(api('users.autocomplete'))
					.query({})
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
			it('should return the users to fill auto complete', (done) => {
				void request
					.get(api('users.autocomplete'))
					.query({ selector: '{}' })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('items').and.to.be.an('array');
					})
					.end(done);
			});

			it('should filter results when using allowed operators', (done) => {
				void request
					.get(api('users.autocomplete'))
					.set(credentials)
					.query({
						selector: JSON.stringify({
							conditions: {
								$and: [
									{
										active: false,
									},
									{
										status: 'online',
									},
								],
							},
						}),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('items').and.to.be.an('array').with.lengthOf(0);
					})
					.end(done);
			});

			it('should return an error when using forbidden operators', (done) => {
				void request
					.get(api('users.autocomplete'))
					.set(credentials)
					.query({
						selector: JSON.stringify({
							conditions: {
								$nor: [
									{
										username: {
											$exists: false,
										},
									},
									{
										status: {
											$exists: false,
										},
									},
								],
							},
						}),
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
	});

	describe('[/users.getStatus]', () => {
		it('should return my own status', (done) => {
			void request
				.get(api('users.getStatus'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('status');
					expect(res.body._id).to.be.equal(credentials['X-User-Id']);
				})
				.end(done);
		});
		it('should return other user status', (done) => {
			void request
				.get(api('users.getStatus'))
				.query({ userId: 'rocket.cat' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('status');
					expect(res.body._id).to.be.equal('rocket.cat');
				})
				.end(done);
		});
	});

	describe('[/users.setStatus]', () => {
		let user: TestUser<IUser>;

		before(async () => {
			user = await createUser();
		});
		after(() => Promise.all([deleteUser(user), updateSetting('Accounts_AllowUserStatusMessageChange', true)]));

		it('should return an error when the setting "Accounts_AllowUserStatusMessageChange" is disabled', (done) => {
			void updateSetting('Accounts_AllowUserStatusMessageChange', false).then(() => {
				void request
					.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: '',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('error-not-allowed');
						expect(res.body.error).to.be.equal('Change status is not allowed [error-not-allowed]');
					})
					.end(done);
			});
		});
		it('should update my own status', (done) => {
			void updateSetting('Accounts_AllowUserStatusMessageChange', true).then(() => {
				void request
					.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: 'test',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						void getUserStatus(credentials['X-User-Id']).then((status) => expect(status.status).to.be.equal('busy'));
					})
					.end(done);
			});
		});
		it('should return an error when trying to update other user status without the required permission', (done) => {
			void updatePermission('edit-other-user-info', []).then(() => {
				void request
					.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: 'test',
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});
		it('should update another user status succesfully', (done) => {
			void updatePermission('edit-other-user-info', ['admin']).then(() => {
				void request
					.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: 'test',
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						void getUserStatus(credentials['X-User-Id']).then((status) => {
							expect(status.status).to.be.equal('busy');
							expect(status.message).to.be.equal('test');
						});
					})
					.end(done);
			});
		});
		it('should return an error when the user try to update user status with an invalid status', (done) => {
			void request
				.post(api('users.setStatus'))
				.set(credentials)
				.send({
					status: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-invalid-status');
					expect(res.body.error).to.be.equal('Valid status types include online, away, offline, and busy. [error-invalid-status]');
				})
				.end(done);
		});
		it('should return an error when user changes status to offline and "Accounts_AllowInvisibleStatusOption" is disabled', async () => {
			await updateSetting('Accounts_AllowInvisibleStatusOption', false);

			await request
				.post(api('users.setStatus'))
				.set(credentials)
				.send({
					status: 'offline',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-status-not-allowed');
					expect(res.body.error).to.be.equal('Invisible status is disabled [error-status-not-allowed]');
				});

			await updateSetting('Accounts_AllowInvisibleStatusOption', true);
		});
		it('should return an error when the payload is missing all supported fields', (done) => {
			void request
				.post(api('users.setStatus'))
				.set(credentials)
				.send({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Match error: Failed Match.OneOf, Match.Maybe or Match.Optional validation');
				})
				.end(done);
		});
	});

	describe('[/users.removeOtherTokens]', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;
		let newCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
			newCredentials = await login(user.username, password);
		});
		after(() => deleteUser(user));

		it('should invalidate all active sesions', (done) => {
			/* We want to validate that the login with the "old" credentials fails
				However, the removal of the tokens is done asynchronously.
				Thus, we check that within the next seconds, at least one try to
				access an authentication requiring route fails */
			let counter = 0;

			async function checkAuthenticationFails() {
				const result = await request.get(api('me')).set(userCredentials);
				return result.statusCode === 401;
			}

			async function tryAuthentication() {
				if (await checkAuthenticationFails()) {
					done();
				} else if (++counter < 20) {
					setTimeout(tryAuthentication, 1000);
				} else {
					done('Session did not invalidate in time');
				}
			}

			void request.post(api('users.removeOtherTokens')).set(newCredentials).expect(200).then(tryAuthentication);
		});
	});

	describe('[/users.listTeams]', () => {
		const teamName1 = `team-name-${Date.now()}`;
		const teamName2 = `team-name-2-${Date.now()}`;
		let testUser: TestUser<IUser>;

		before('create team 1', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName1,
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
				})
				.end(done);
		});

		before('create team 2', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName2,
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
				})
				.end(done);
		});

		before('create new user', async () => {
			testUser = await createUser({ joinDefaultChannels: false });
		});

		before('add test user to team 1', (done) => {
			void request
				.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: teamName1,
					members: [
						{
							userId: testUser._id,
							roles: ['member'],
						},
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() => done());
		});

		before('add test user to team 2', (done) => {
			void request
				.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: teamName2,
					members: [
						{
							userId: testUser._id,
							roles: ['member', 'owner'],
						},
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() => done());
		});

		after(() => Promise.all([...[teamName1, teamName2].map((team) => deleteTeam(credentials, team)), deleteUser(testUser)]));

		it('should list both channels', (done) => {
			void request
				.get(api('users.listTeams'))
				.set(credentials)
				.query({
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('teams');

					const { teams } = res.body;

					expect(teams).to.have.length(2);
					expect(teams[0].isOwner).to.not.be.eql(teams[1].isOwner);
				})
				.end(done);
		});
	});

	describe('[/users.logout]', () => {
		let user: TestUser<IUser>;
		let otherUser: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			otherUser = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(() => Promise.all([deleteUser(user), deleteUser(otherUser), updatePermission('logout-other-user', ['admin'])]));

		it('should throw unauthorized error to user w/o "logout-other-user" permission', (done) => {
			void updatePermission('logout-other-user', []).then(() => {
				void request
					.post(api('users.logout'))
					.set(credentials)
					.send({ userId: otherUser._id })
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});

		it('should logout other user', (done) => {
			void updatePermission('logout-other-user', ['admin']).then(() => {
				void request
					.post(api('users.logout'))
					.set(credentials)
					.send({ userId: otherUser._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.end(done);
			});
		});

		it('should logout the requester', (done) => {
			void updatePermission('logout-other-user', []).then(() => {
				void request.post(api('users.logout')).set(userCredentials).expect('Content-Type', 'application/json').expect(200).end(done);
			});
		});
	});

	describe('[/users.listByStatus]', () => {
		let user: TestUser<IUser>;
		let otherUser: TestUser<IUser>;
		let otherUserCredentials: Credentials;

		before(async () => {
			user = await createUser();
			otherUser = await createUser();
			otherUserCredentials = await login(otherUser.username, password);
		});

		after(async () => {
			await deleteUser(user);
			await deleteUser(otherUser);
			await updatePermission('view-outside-room', ['admin', 'owner', 'moderator', 'user']);
			await updatePermission('view-d-room', ['admin', 'owner', 'moderator', 'user']);
		});

		it('should list pending users', async () => {
			await request
				.get(api('users.listByStatus'))
				.set(credentials)
				.query({ hasLoggedIn: false, type: 'user', count: 50 })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					const { users } = res.body as PaginatedResult<{
						users: DefaultUserInfo[];
					}>;
					const ids = users.map((user) => user._id);
					expect(ids).to.include(user._id);
				});
		});

		it('should list all users', async () => {
			await request
				.get(api('users.listByStatus'))
				.query({ searchTerm: user.name })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					const { users } = res.body as PaginatedResult<{
						users: DefaultUserInfo[];
					}>;
					const ids = users.map((user) => user._id);
					expect(ids).to.include(user._id);
				});
		});

		it('should list active users', async () => {
			await login(user.username, password);
			await request
				.get(api('users.listByStatus'))
				.set(credentials)
				.query({ hasLoggedIn: true, status: 'active', searchTerm: user.name })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					const { users } = res.body as PaginatedResult<{
						users: DefaultUserInfo[];
					}>;
					const ids = users.map((user) => user._id);
					expect(ids).to.include(user._id);
				});
		});

		it('should filter users by role', async () => {
			await login(user.username, password);
			await request
				.get(api('users.listByStatus'))
				.set(credentials)
				.query({ 'roles[]': 'admin' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					const { users } = res.body as PaginatedResult<{
						users: DefaultUserInfo[];
					}>;
					const ids = users.map((user) => user._id);
					expect(ids).to.not.include(user._id);
				});
		});

		it('should list deactivated users', async () => {
			await request.post(api('users.setActiveStatus')).set(credentials).send({
				userId: user._id,
				activeStatus: false,
				confirmRelinquish: false,
			});
			await request
				.get(api('users.listByStatus'))
				.set(credentials)
				.query({ hasLoggedIn: true, status: 'deactivated' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					const { users } = res.body as PaginatedResult<{
						users: DefaultUserInfo[];
					}>;
					const ids = users.map((user) => user._id);
					expect(ids).to.include(user._id);
				});
		});

		it('should filter users by username', async () => {
			await request
				.get(api('users.listByStatus'))
				.set(credentials)
				.query({ searchTerm: user.username })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users');
					const { users } = res.body as PaginatedResult<{
						users: DefaultUserInfo[];
					}>;
					const ids = users.map((user) => user._id);
					expect(ids).to.include(user._id);
				});
		});

		it('should return error for invalid status params', async () => {
			await request
				.get(api('users.listByStatus'))
				.set(credentials)
				.query({ status: 'abcd' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('invalid-params');
					expect(res.body.error).to.be.equal('must be equal to one of the allowed values [invalid-params]');
				});
		});

		it('should throw unauthorized error to user without "view-d-room" permission', async () => {
			await updatePermission('view-d-room', ['admin']);
			await request
				.get(api('users.listByStatus'))
				.set(otherUserCredentials)
				.query({ status: 'active' })
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should throw unauthorized error to user without "view-outside-room" permission', async () => {
			await updatePermission('view-outside-room', ['admin']);
			await request
				.get(api('users.listByStatus'))
				.set(otherUserCredentials)
				.query({ status: 'active' })
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('[/users.sendWelcomeEmail]', async () => {
		let user: TestUser<IUser>;
		let otherUser: TestUser<IUser>;

		before(async () => {
			user = await createUser();
			otherUser = await createUser();
		});

		after(async () => {
			await deleteUser(user);
			await deleteUser(otherUser);
		});

		it('should send Welcome Email to user', async () => {
			await updateSetting('SMTP_Host', 'localhost');

			await request
				.post(api('users.sendWelcomeEmail'))
				.set(credentials)
				.send({ email: user.emails[0].address })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail to send Welcome Email due to SMTP settings missing', async () => {
			await updateSetting('SMTP_Host', '');

			await request
				.post(api('users.sendWelcomeEmail'))
				.set(credentials)
				.send({ email: user.emails[0].address })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('SMTP is not configured [error-email-send-failed]');
				});
		});

		it('should fail to send Welcome Email due to missing param', async () => {
			await updateSetting('SMTP_Host', '');

			await request
				.post(api('users.sendWelcomeEmail'))
				.set(credentials)
				.send({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error', "must have required property 'email' [invalid-params]");
				});
		});

		it('should fail to send Welcome Email due missing user', async () => {
			await updateSetting('SMTP_Host', 'localhost');

			await request
				.post(api('users.sendWelcomeEmail'))
				.set(credentials)
				.send({ email: 'fake_user32132131231@rocket.chat' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-user');
					expect(res.body).to.have.property('error', 'Invalid user [error-invalid-user]');
				});
		});
	});
});
