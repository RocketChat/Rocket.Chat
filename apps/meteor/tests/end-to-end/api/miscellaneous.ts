import type { Credentials } from '@rocket.chat/api-client';
import type { IInstanceStatus, IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import type { IInstance } from '@rocket.chat/rest-typings';
import { AssertionError, expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, methodCall } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { adminEmail, adminUsername, adminPassword, password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login as doLogin } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

describe('miscellaneous', () => {
	before((done) => getCredentials(done));

	describe('API default', () => {
		// Required by mobile apps
		describe('/info', () => {
			let version: string;
			it('should return "version", "build", "commit" and "marketplaceApiVersion" when the user is logged in', (done) => {
				void request
					.get('/api/info')
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('version').and.to.be.a('string');
						expect(res.body.info).to.have.property('version').and.to.be.a('string');
						expect(res.body.info).to.have.property('build').and.to.be.an('object');
						expect(res.body.info).to.have.property('commit').and.to.be.an('object');
						expect(res.body.info).to.have.property('marketplaceApiVersion').and.to.be.a('string');
						version = res.body.info.version;
					})
					.end(done);
			});
			it('should return only "version" and the version should not have patch info when the user is not logged in', (done) => {
				void request
					.get('/api/info')
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('version');
						expect(res.body).to.not.have.property('info');
						expect(res.body.version).to.be.equal(version.replace(/(\d+\.\d+).*/, '$1'));
					})
					.end(done);
			});
		});
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.lengthOf.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.lengthOf.at.least(1);
	});

	it('/login (wrapper username)', (done) => {
		void request
			.post(api('login'))
			.send({
				user: {
					username: adminUsername,
				},
				password: adminPassword,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'success');
				expect(res.body).to.have.property('data').and.to.be.an('object');
				expect(res.body.data).to.have.property('userId');
				expect(res.body.data).to.have.property('authToken');
				expect(res.body.data).to.have.property('me');
			})
			.end(done);
	});

	it('/login (wrapper email)', (done) => {
		void request
			.post(api('login'))
			.send({
				user: {
					email: adminEmail,
				},
				password: adminPassword,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'success');
				expect(res.body).to.have.property('data').and.to.be.an('object');
				expect(res.body.data).to.have.property('userId');
				expect(res.body.data).to.have.property('authToken');
				expect(res.body.data).to.have.property('me');
			})
			.end(done);
	});

	it('/login by user', (done) => {
		void request
			.post(api('login'))
			.send({
				user: adminEmail,
				password: adminPassword,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'success');
				expect(res.body).to.have.property('data').and.to.be.an('object');
				expect(res.body.data).to.have.property('userId');
				expect(res.body.data).to.have.property('authToken');
				expect(res.body.data).to.have.property('me');
				expect(res.body.data.me.services).to.not.have.nested.property('password.bcrypt');
				expect(res.body.data.me.services).to.have.nested.property('password.exists', true);
			})
			.end(done);
	});

	it('/login by username', (done) => {
		void request
			.post(api('login'))
			.send({
				username: adminUsername,
				password: adminPassword,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('status', 'success');
				expect(res.body).to.have.property('data').and.to.be.an('object');
				expect(res.body.data).to.have.property('userId');
				expect(res.body.data).to.have.property('authToken');
				expect(res.body.data).to.have.property('me');
				expect(res.body.data.me.services).to.not.have.nested.property('password.bcrypt');
				expect(res.body.data.me.services).to.have.nested.property('password.exists', true);
			})
			.end(done);
	});

	it('/me', async () => {
		const user = await createUser();
		const userCredentials = await doLogin(user.username, password);

		await request
			.get(api('me'))
			.set(userCredentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				const allUserPreferencesKeys = [
					'alsoSendThreadToChannel',
					// 'language',
					'newRoomNotification',
					'newMessageNotification',
					'showThreadsInMainChannel',
					// 'clockMode',
					'useEmojis',
					'convertAsciiEmoji',
					'saveMobileBandwidth',
					'collapseMediaByDefault',
					'autoImageLoad',
					'emailNotificationMode',
					'unreadAlert',
					'masterVolume',
					'notificationsSoundVolume',
					'voipRingerVolume',
					'omnichannelTranscriptEmail',
					IS_EE ? 'omnichannelTranscriptPDF' : false,
					'desktopNotifications',
					'pushNotifications',
					'enableAutoAway',
					// 'highlights',
					'desktopNotificationRequireInteraction',
					'hideUsernames',
					'hideRoles',
					'displayAvatars',
					'hideFlexTab',
					'sendOnEnter',
					'idleTimeLimit',
					'sidebarShowFavorites',
					'sidebarShowUnread',
					'themeAppearence',
					'sidebarSortby',
					'sidebarViewMode',
					'sidebarDisplayAvatar',
					'sidebarGroupByType',
					'sidebarSectionsOrder',
					'muteFocusedConversations',
					'notifyCalendarEvents',
					'enableMobileRinging',
					'featuresPreview',
				].filter((p) => Boolean(p));

				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('_id', user._id);
				expect(res.body).to.have.property('username', user.username);
				expect(res.body).to.have.property('active');
				expect(res.body).to.have.property('name');
				expect(res.body).to.have.property('roles').and.to.be.an('array');
				expect(res.body).to.have.nested.property('emails[0].address', user.emails[0].address);
				expect(res.body).to.have.nested.property('settings.preferences').and.to.be.an('object');
				expect(res.body.settings.preferences).to.have.all.keys(allUserPreferencesKeys);
				expect(res.body).to.have.property('isOAuthUser', false);
				expect(res.body.services).to.not.have.nested.property('password.bcrypt');
				expect(res.body.services).to.have.nested.property('password.exists', true);
			});

		await deleteUser(user);
	});

	describe('/directory', () => {
		let user: TestUser<IUser>;
		let testChannel: IRoom;
		let normalUserCredentials: Credentials;
		const teamName = `new-team-name-${Date.now()}` as const;
		let teamCreated: ITeam;

		before(async () => {
			await updatePermission('create-team', ['admin', 'user']);
			user = await createUser();
			normalUserCredentials = await doLogin(user.username, password);
			testChannel = (await createRoom({ name: `channel.test.${Date.now()}`, type: 'c' })).body.channel;
			teamCreated = await createTeam(normalUserCredentials, teamName, TEAM_TYPE.PUBLIC);
		});

		after(async () => {
			await Promise.all([
				deleteTeam(normalUserCredentials, teamName),
				deleteUser(user),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('create-team', ['admin', 'user']),
			]);
		});

		it('should return an array(result) when search by user and execute successfully', (done) => {
			void request
				.get(api('directory'))
				.set(credentials)
				.query({
					text: user.username,
					type: 'users',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('result').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.result[0]).to.have.property('_id');
					expect(res.body.result[0]).to.have.property('createdAt');
					expect(res.body.result[0]).to.have.property('username');
					expect(res.body.result[0]).to.have.property('emails').and.to.be.an('array');
					expect(res.body.result[0]).to.have.property('name');
				})
				.end(done);
		});

		it('should not return the emails field for non admins', (done) => {
			void request
				.get(api('directory'))
				.set(normalUserCredentials)
				.query({
					text: user.username,
					type: 'users',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('result').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.result[0]).to.have.property('_id');
					expect(res.body.result[0]).to.have.property('createdAt');
					expect(res.body.result[0]).to.have.property('username');
					expect(res.body.result[0]).to.not.have.property('emails');
					expect(res.body.result[0]).to.have.property('name');
				})
				.end(done);
		});
		it('should return an array(result) when search by channel and execute successfully', (done) => {
			void request
				.get(api('directory'))
				.set(credentials)
				.query({
					text: testChannel.name,
					type: 'channels',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('result').and.to.be.an('array');
					expect(res.body.result[0]).to.have.property('_id');
					expect(res.body.result[0]).to.have.property('name');
					expect(res.body.result[0]).to.have.property('usersCount').and.to.be.an('number');
					expect(res.body.result[0]).to.have.property('ts');
				})
				.end(done);
		});
		it('should return an array(result) when search by channel with sort params correctly and execute successfully', (done) => {
			void request
				.get(api('directory'))
				.set(credentials)
				.query({
					text: testChannel.name,
					type: 'channels',
					sort: JSON.stringify({
						name: 1,
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('result').and.to.be.an('array');
					expect(res.body.result[0]).to.have.property('_id');
					expect(res.body.result[0]).to.have.property('name');
					expect(res.body.result[0]).to.have.property('usersCount').and.to.be.an('number');
					expect(res.body.result[0]).to.have.property('ts');
				})
				.end(done);
		});
		it('should return an error when send invalid query', (done) => {
			void request
				.get(api('directory'))
				.set(credentials)
				.query({
					text: 'invalid channel',
					type: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when have more than one sort parameter', (done) => {
			void request
				.get(api('directory'))
				.set(credentials)
				.query({
					text: testChannel.name,
					type: 'channels',
					sort: JSON.stringify({
						name: 1,
						test: 1,
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an object containing rooms and totalCount from teams', (done) => {
			void request
				.get(api('directory'))
				.set(normalUserCredentials)
				.query({
					text: '',
					type: 'teams',
					sort: JSON.stringify({
						name: 1,
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('result');
					expect(res.body.result).to.be.an(`array`);
					expect(res.body).to.have.property('total');
					expect(res.body.total).to.be.an('number');
					expect(res.body.result[0]).to.have.property('_id', teamCreated.roomId);
					expect(res.body.result[0]).to.have.property('fname');
					expect(res.body.result[0]).to.have.property('teamMain');
					expect(res.body.result[0]).to.have.property('name');
					expect(res.body.result[0]).to.have.property('t');
					expect(res.body.result[0]).to.have.property('usersCount');
					expect(res.body.result[0]).to.have.property('ts');
					expect(res.body.result[0]).to.have.property('teamId');
					expect(res.body.result[0]).to.have.property('default');
					expect(res.body.result[0]).to.have.property('roomsCount');
				})
				.end(done);
		});
	});

	describe('[/spotlight]', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;
		let testChannel: IRoom;
		let testTeam: ITeam;
		let testChannelSpecialChars: IRoom;
		const fnameSpecialCharsRoom = `test ГДΕληνικά-${Date.now()}`;
		const teamName = `team-test-${Date.now()}`;

		before(async () => {
			user = await createUser();
			userCredentials = await doLogin(user.username, password);
			await updateSetting('UI_Allow_room_names_with_special_chars', true);
			testChannelSpecialChars = (await createRoom({ type: 'c', name: fnameSpecialCharsRoom, credentials: userCredentials })).body.channel;
			testChannel = (await createRoom({ type: 'c', name: `channel.test.${Date.now()}`, credentials: userCredentials })).body.channel;
			testTeam = await createTeam(userCredentials, teamName, TEAM_TYPE.PUBLIC);
		});

		after(async () => {
			await Promise.all([
				deleteUser(user),
				updateSetting('UI_Allow_room_names_with_special_chars', false),
				deleteTeam(userCredentials, teamName),
			]);
		});

		it('should fail when does not have query param', (done) => {
			void request
				.get(api('spotlight'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
		it('should return object inside users array when search by a valid user', (done) => {
			void request
				.get(api('spotlight'))
				.query({
					query: `@${adminUsername}`,
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users').and.to.be.an('array');
					expect(res.body.users[0]).to.have.property('_id');
					expect(res.body.users[0]).to.have.property('name');
					expect(res.body.users[0]).to.have.property('username');
					expect(res.body.users[0]).to.have.property('status');
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
				})
				.end(done);
		});
		it('must return the object inside the room array when searching for a valid room and that user is not a member of it', (done) => {
			void request
				.get(api('spotlight'))
				.query({
					query: `#${testChannel.name}`,
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users').and.to.be.an('array');
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body.rooms[0]).to.have.property('_id');
					expect(res.body.rooms[0]).to.have.property('name');
					expect(res.body.rooms[0]).to.have.property('t');
				})
				.end(done);
		});
		it('must return the teamMain property when searching for a valid team that the user is not a member of', (done) => {
			void request
				.get(api('spotlight'))
				.query({
					query: `${testTeam.name}`,
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users').and.to.be.an('array');
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body.rooms[0]).to.have.property('_id');
					expect(res.body.rooms[0]).to.have.property('name');
					expect(res.body.rooms[0]).to.have.property('t');
					expect(res.body.rooms[0]).to.have.property('teamMain');
				})
				.end(done);
		});
		it('must return rooms when searching for a valid fname', (done) => {
			void request
				.get(api('spotlight'))
				.query({
					query: `#${fnameSpecialCharsRoom}`,
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users').and.to.be.an('array');
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body.rooms[0]).to.have.property('_id', testChannelSpecialChars._id);
					expect(res.body.rooms[0]).to.have.property('name', testChannelSpecialChars.name);
					expect(res.body.rooms[0]).to.have.property('t', testChannelSpecialChars.t);
				})
				.end(done);
		});
	});

	describe('[/instances.get]', () => {
		let unauthorizedUserCredentials: Credentials;
		before(async () => {
			const createdUser = await createUser();
			unauthorizedUserCredentials = await doLogin(createdUser.username, password);
		});

		it('should fail if user is logged in but is unauthorized', (done) => {
			void request
				.get(api('instances.get'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				})
				.end(done);
		});

		it('should fail if not logged in', (done) => {
			void request
				.get(api('instances.get'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return instances if user is logged in and is authorized', (done) => {
			void request
				.get(api('instances.get'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);

					expect(res.body).to.have.property('instances').and.to.be.an('array').with.lengthOf(1);

					const instances = res.body.instances as IInstance[];

					const instanceName = IS_EE ? 'ddp-streamer' : 'rocket.chat';

					const instance = instances.find(
						(i): i is IInstance & { instanceRecord: IInstanceStatus } => i.instanceRecord?.name === instanceName,
					);

					if (!instance) throw new AssertionError(`no instance named "${instanceName}"`);

					expect(instance).to.have.property('instanceRecord');
					expect(instance).to.have.property('currentStatus');

					expect(instance.currentStatus).to.have.property('connected');

					expect(instance.instanceRecord).to.have.property('_id');
					expect(instance.instanceRecord).to.have.property('extraInformation');
					expect(instance.instanceRecord).to.have.property('name');
					expect(instance.instanceRecord).to.have.property('pid');

					if (!IS_EE) {
						expect(instance).to.have.property('address');

						expect(instance.currentStatus).to.have.property('lastHeartbeatTime');
						expect(instance.currentStatus).to.have.property('local');

						const { extraInformation } = instance.instanceRecord;

						expect(extraInformation).to.have.property('host');
						expect(extraInformation).to.have.property('port');
						expect(extraInformation).to.have.property('os').and.to.have.property('cpus').to.be.a('number');
						expect(extraInformation).to.have.property('nodeVersion');
					}
				})
				.end(done);
		});
	});

	describe('[/shield.svg]', () => {
		before(() => updateSetting('API_Enable_Shields', false));

		after(() => updateSetting('API_Enable_Shields', true));

		it('should fail if API_Enable_Shields is disabled', (done) => {
			void request
				.get(api('shield.svg'))
				.query({
					type: 'online',
					icon: true,
					channel: 'general',
					name: 'Rocket.Chat',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-endpoint-disabled');
				})
				.end(done);
		});

		it('should succeed if API_Enable_Shields is enabled', (done) => {
			void updateSetting('API_Enable_Shields', true).then(() => {
				void request
					.get(api('shield.svg'))
					.query({
						type: 'online',
						icon: true,
						channel: 'general',
						name: 'Rocket.Chat',
					})
					.expect('Content-Type', 'image/svg+xml;charset=utf-8')
					.expect(200)
					.end(done);
			});
		});
	});

	describe('/pw.getPolicy', () => {
		it('should return policies', (done) => {
			void request
				.get(api('pw.getPolicy'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('enabled');
					expect(res.body).to.have.property('policy').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('[/stdout.queue]', () => {
		let testUser: TestUser<IUser>;
		let testUsername: string;
		let testUserPassword: string;
		before(async () => {
			testUser = await createUser();
			testUsername = testUser.username;
			testUserPassword = password;
			await updateSetting('Log_Trace_Methods', true);
			await updateSetting('Log_Level', '2');

			// populate the logs by sending method calls
			const populateLogsPromises = [];
			populateLogsPromises.push(
				request
					.post(methodCall('getRoomRoles'))
					.set(credentials)
					.set('Cookie', `rc_token=${credentials['X-Auth-Token']}`)
					.send({
						message: JSON.stringify({
							method: 'getRoomRoles',
							params: ['GENERAL'],
							id: 'id',
							msg: 'method',
						}),
					}),
			);

			populateLogsPromises.push(
				request
					.post(methodCall('private-settings:get'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'private-settings/get',
							params: [
								{
									$date: new Date().getTime(),
								},
							],
							id: 'id',
							msg: 'method',
						}),
					}),
			);

			populateLogsPromises.push(
				request.post(api('login')).send({
					user: {
						username: testUsername,
					},
					password: testUserPassword,
				}),
			);

			await Promise.all(populateLogsPromises);
		});

		after(async () => {
			await Promise.all([updateSetting('Log_Trace_Methods', false), updateSetting('Log_Level', '0'), deleteUser(testUser)]);
		});

		it('if log trace enabled, x-auth-token should be redacted', async () => {
			await request
				.get(api('stdout.queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('queue').that.is.an('array');

					const { queue } = res.body;
					let foundRedactedToken = false;

					for (const log of queue) {
						if (log.string.includes("'x-auth-token': '[redacted]'")) {
							foundRedactedToken = true;
							break;
						}
					}

					expect(foundRedactedToken).to.be.true;
				});
		});

		it('if log trace enabled, rc_token should be redacted', async () => {
			await request
				.get(api('stdout.queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('queue').that.is.an('array');

					const { queue } = res.body;
					let foundRedactedCookie = false;

					for (const log of queue) {
						if (log.string.includes('rc_token=[redacted]')) {
							foundRedactedCookie = true;
							break;
						}
					}

					expect(foundRedactedCookie).to.be.true;
				});
		});

		it('should not return user token anywhere in the log stream', async () => {
			await request
				.get(api('stdout.queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('queue').that.is.an('array');

					const { queue } = res.body;
					let foundTokenValue = false;

					for (const log of queue) {
						if (log.string.includes(credentials['X-Auth-Token'])) {
							foundTokenValue = true;
							break;
						}
					}

					expect(foundTokenValue).to.be.false;
				});
		});

		describe('permissions', () => {
			before(async () => {
				return updatePermission('view-logs', ['admin']);
			});

			after(async () => {
				return updatePermission('view-logs', ['admin']);
			});

			it('should return server logs', async () => {
				return request
					.get(api('stdout.queue'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);

						expect(res.body).to.have.property('queue').and.to.be.an('array').that.is.not.empty;
						expect(res.body.queue[0]).to.be.an('object');
						expect(res.body.queue[0]).to.have.property('id').and.to.be.a('string');
						expect(res.body.queue[0]).to.have.property('string').and.to.be.a('string');
						expect(res.body.queue[0]).to.have.property('ts').and.to.be.a('string');
					});
			});

			it('should not return server logs if user does NOT have the view-logs permission', async () => {
				await updatePermission('view-logs', []);
				return request
					.get(api('stdout.queue'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
					});
			});
		});
	});
});
