import { getCredentials, api, login, request, credentials } from '../../data/api-data.js';
import { adminEmail, adminUsername, adminPassword, password } from '../../data/user.js';

describe('miscellaneous', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('API default', () => {
		// Required by mobile apps
		it('/info', (done) => {
			request.get('/api/info')
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('version');
				})
				.end(done);
		});
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.length.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.length.at.least(1);
	});

	it('/login (wrapper username)', (done) => {
		request.post(api('login'))
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
		request.post(api('login'))
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
		request.post(api('login'))
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
		request.post(api('login'))
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
		request.get(api('me'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				const allUserPreferencesKeys = [
					'audioNotifications',
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
					'mobileNotifications',
					'enableAutoAway',
					// 'highlights',
					'desktopNotificationDuration',
					'messageViewMode',
					'hideUsernames',
					'hideRoles',
					'hideAvatars',
					'hideFlexTab',
					'sendOnEnter',
					'roomCounterSidebar',
					'idleTimeLimit',
					'sidebarShowFavorites',
					'sidebarShowUnread',
					// 'sidebarSortby',
					'sidebarViewMode',
					'sidebarHideAvatar',
					'sidebarGroupByType',
					'muteFocusedConversations',
					'sidebarShowDiscussion',
					'sidebarShowServiceAccounts',
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
			})
			.end(done);
	});

	describe('/directory', () => {
		let user;
		let testChannel;
		before((done) => {
			const username = `user.test.${ Date.now() }`;
			const email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done();
				});
		});
		after((done) => {
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id,
			}).end(done);
			user = undefined;
		});
		it('create an channel', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${ Date.now() }`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('should return an array(result) when search by user and execute succesfully', (done) => {
			request.get(api('directory'))
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
		it('should return an array(result) when search by channel and execute succesfully', (done) => {
			request.get(api('directory'))
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
		it('should return an array(result) when search by channel with sort params correctly and execute succesfully', (done) => {
			request.get(api('directory'))
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
			request.get(api('directory'))
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
			request.get(api('directory'))
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
	});
	describe('[/spotlight]', () => {
		let user;
		before((done) => {
			const username = `user.test.${ Date.now() }`;
			const email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
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
			request.post(api('login'))
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
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id,
			}).end(done);
			user = undefined;
		});
		it('create an channel', (done) => {
			request.post(api('channels.create'))
				.set(userCredentials)
				.send({
					name: `channel.test.${ Date.now() }`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('should fail when does not have query param', (done) => {
			request.get(api('spotlight'))
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
			request.get(api('spotlight'))
				.query({
					query: `@${ adminUsername }`,
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
			request.get(api('spotlight'))
				.query({
					query: `#${ testChannel.name }`,
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
});
