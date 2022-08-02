import { expect } from 'chai';

import { getCredentials, api, login, request, credentials } from '../../data/api-data.js';
import { adminEmail, adminUsername, adminPassword, password } from '../../data/user.js';
import { createUser, login as doLogin } from '../../data/users.helper';
import { updateSetting } from '../../data/permissions.helper';

describe('miscellaneous', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('API default', () => {
		// Required by mobile apps
		describe('/info', () => {
			let version;
			it('should return "version", "build", "commit" and "marketplaceApiVersion" when the user is logged in', (done) => {
				request
					.get('/api/info')
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body.info).to.have.property('version').and.to.be.a('string');
						expect(res.body.info).to.have.property('build').and.to.be.an('object');
						expect(res.body.info).to.have.property('commit').and.to.be.an('object');
						expect(res.body.info).to.have.property('marketplaceApiVersion').and.to.be.a('string');
						version = res.body.info.version;
					})
					.end(done);
			});
			it('should return only "version" and the version should not have patch info when the user is not logged in', (done) => {
				request
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
		request
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
		request
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
		request
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
			})
			.end(done);
	});

	it('/login by username', (done) => {
		request
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
			})
			.end(done);
	});

	it('/me', (done) => {
		request
			.get(api('me'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				const allUserPreferencesKeys = [
					'alsoSendThreadToChannel',
					// 'language',
					'newRoomNotification',
					'newMessageNotification',
					// 'clockMode',
					'useEmojis',
					'convertAsciiEmoji',
					'saveMobileBandwidth',
					'collapseMediaByDefault',
					'autoImageLoad',
					'emailNotificationMode',
					'unreadAlert',
					'notificationsSoundVolume',
					'desktopNotifications',
					'pushNotifications',
					'enableAutoAway',
					'useLegacyMessageTemplate',
					// 'highlights',
					'desktopNotificationRequireInteraction',
					'messageViewMode',
					'hideUsernames',
					'hideRoles',
					'displayAvatars',
					'hideFlexTab',
					'sendOnEnter',
					'idleTimeLimit',
					'sidebarShowFavorites',
					'sidebarShowUnread',
					'sidebarSortby',
					'sidebarViewMode',
					'sidebarDisplayAvatar',
					'sidebarGroupByType',
					'muteFocusedConversations',
				];

				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('_id', credentials['X-User-Id']);
				expect(res.body).to.have.property('username', login.user);
				expect(res.body).to.have.property('active');
				expect(res.body).to.have.property('name');
				expect(res.body).to.have.property('roles').and.to.be.an('array');
				expect(res.body).to.have.nested.property('emails[0].address', adminEmail);
				expect(res.body).to.have.nested.property('settings.preferences').and.to.be.an('object');
				expect(res.body.settings.preferences).to.have.all.keys(allUserPreferencesKeys);
				expect(res.body.services).to.not.have.nested.property('password.bcrypt');
			})
			.end(done);
	});

	describe('/directory', () => {
		let user;
		let testChannel;
		before((done) => {
			const username = `user.test.${Date.now()}`;
			const email = `${username}@rocket.chat`;
			request
				.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done();
				});
		});
		after((done) => {
			request
				.post(api('users.delete'))
				.set(credentials)
				.send({
					userId: user._id,
				})
				.end(done);
			user = undefined;
		});
		it('create an channel', (done) => {
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${Date.now()}`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('should return an array(result) when search by user and execute successfully', (done) => {
			request
				.get(api('directory'))
				.set(credentials)
				.query({
					query: JSON.stringify({
						text: user.username,
						type: 'users',
					}),
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

		let normalUser;
		before((done) => {
			request
				.post(api('login'))
				.send({
					username: user.username,
					password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'success');
					expect(res.body).to.have.property('data').and.to.be.an('object');
					expect(res.body.data).to.have.property('userId');
					expect(res.body.data).to.have.property('authToken');
					normalUser = res.body.data;
				})
				.end(done);
		});
		it('should not return the emails field for non admins', (done) => {
			request
				.get(api('directory'))
				.set({
					'X-Auth-Token': normalUser.authToken,
					'X-User-Id': normalUser.userId,
				})
				.query({
					query: JSON.stringify({
						text: user.username,
						type: 'users',
					}),
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
			request
				.get(api('directory'))
				.set(credentials)
				.query({
					query: JSON.stringify({
						text: testChannel.name,
						type: 'channels',
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
		it('should return an array(result) when search by channel with sort params correctly and execute successfully', (done) => {
			request
				.get(api('directory'))
				.set(credentials)
				.query({
					query: JSON.stringify({
						text: testChannel.name,
						type: 'channels',
					}),
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
			request
				.get(api('directory'))
				.set(credentials)
				.query({
					query: JSON.stringify({
						text: 'invalid channel',
						type: 'invalid',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when have more than one sort parameter', (done) => {
			request
				.get(api('directory'))
				.set(credentials)
				.query({
					query: JSON.stringify({
						text: testChannel.name,
						type: 'channels',
					}),
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

		const teamName = `new-team-name-${Date.now()}`;
		let teamCreated = {};
		before((done) => {
			request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.expect((res) => {
					teamCreated = res.body.team;
				})
				.end(done);
		});

		after((done) => {
			request
				.post(api('teams.delete'))
				.set(credentials)
				.send({
					teamName,
				})
				.end(done);
		});

		it('should return an object containing rooms and totalCount from teams', (done) => {
			request
				.get(api('directory'))
				.set(credentials)
				.query({
					query: JSON.stringify({
						text: '',
						type: 'teams',
					}),
					sort: JSON.stringify({
						name: 1,
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('result');
					expect(res.body.result).to.be.an(`array`);
					expect(res.body).to.have.property('total', 1);
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
		let user;
		before((done) => {
			const username = `user.test.${Date.now()}`;
			const email = `${username}@rocket.chat`;
			request
				.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done();
				});
		});

		let userCredentials;
		let testChannel;
		before((done) => {
			request
				.post(api('login'))
				.send({
					user: user.username,
					password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					userCredentials = {};
					userCredentials['X-Auth-Token'] = res.body.data.authToken;
					userCredentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done);
		});
		after((done) => {
			request
				.post(api('users.delete'))
				.set(credentials)
				.send({
					userId: user._id,
				})
				.end(done);
			user = undefined;
		});
		it('create an channel', (done) => {
			request
				.post(api('channels.create'))
				.set(userCredentials)
				.send({
					name: `channel.test.${Date.now()}`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('should fail when does not have query param', (done) => {
			request
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
			request
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
			request
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
	});

	describe('[/instances.get]', () => {
		let unauthorizedUserCredentials;
		before(async () => {
			const createdUser = await createUser();
			unauthorizedUserCredentials = await doLogin(createdUser.username, password);
		});

		it('should fail if user is logged in but is unauthorized', (done) => {
			request
				.get(api('instances.get'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		it('should fail if not logged in', (done) => {
			request
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
			request
				.get(api('instances.get'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('instances').and.to.be.an('array').with.lengthOf(1);

					const {
						instances: [instance],
					} = res.body;

					expect(instance).to.have.property('_id');
					expect(instance).to.have.property('extraInformation');
					expect(instance).to.have.property('name');
					expect(instance).to.have.property('pid');

					const { extraInformation } = instance;

					expect(extraInformation).to.have.property('host');
					expect(extraInformation).to.have.property('port');
					expect(extraInformation).to.have.property('os').and.to.have.property('cpus').to.be.a('number');
					expect(extraInformation).to.have.property('nodeVersion');
				})
				.end(done);
		});
	});

	describe('[/shield.svg]', () => {
		it('should fail if API_Enable_Shields is disabled', (done) => {
			updateSetting('API_Enable_Shields', false).then(() => {
				request
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
		});

		it('should succeed if API_Enable_Shields is enabled', (done) => {
			updateSetting('API_Enable_Shields', true).then(() => {
				request
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
});
