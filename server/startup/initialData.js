Meteor.startup(function() {
	Meteor.defer(function() {
		if (!RocketChat.models.Rooms.findOneById('GENERAL')) {
			RocketChat.models.Rooms.createWithIdTypeAndName('GENERAL', 'c', 'general', {
				'default': true
			});
		}

		if (!RocketChat.models.Users.db.findOneById('rocket.cat')) {
			RocketChat.models.Users.create({
				_id: 'rocket.cat',
				name: 'Rocket.Cat',
				username: 'rocket.cat',
				status: 'online',
				statusDefault: 'online',
				utcOffset: 0,
				active: true,
				type: 'bot'
			});

			RocketChat.authz.addUserRoles('rocket.cat', 'bot');

			const rs = RocketChatFile.bufferToStream(new Buffer(Assets.getBinary('avatars/rocketcat.png'), 'utf8'));

			RocketChatFileAvatarInstance.deleteFile('rocket.cat.jpg');

			const ws = RocketChatFileAvatarInstance.createWriteStream('rocket.cat.jpg', 'image/png');

			ws.on('end', Meteor.bindEnvironment(function() {
				return RocketChat.models.Users.setAvatarOrigin('rocket.cat', 'local');
			}));

			rs.pipe(ws);
		}

		if (process.env.ADMIN_PASS) {
			if (_.isEmpty(RocketChat.authz.getUsersInRole('admin').fetch())) {
				console.log('Inserting admin user:'.green);
				const adminUser = {
					name: 'Administrator',
					username: 'admin',
					status: 'offline',
					statusDefault: 'online',
					utcOffset: 0,
					active: true
				};

				if (process.env.ADMIN_NAME) {
					adminUser.name = process.env.ADMIN_NAME;
				}

				console.log((`Name: ${ adminUser.name }`).green);

				if (process.env.ADMIN_EMAIL) {
					const re = /^[^@].*@[^@]+$/i;

					if (re.test(process.env.ADMIN_EMAIL)) {
						if (!RocketChat.models.Users.findOneByEmailAddress(process.env.ADMIN_EMAIL)) {
							adminUser.emails = [{
								address: process.env.ADMIN_EMAIL,
								verified: true
							}];

							console.log((`Email: ${ process.env.ADMIN_EMAIL }`).green);
						} else {
							console.log('Email provided already exists; Ignoring environment variables ADMIN_EMAIL'.red);
						}
					} else {
						console.log('Email provided is invalid; Ignoring environment variables ADMIN_EMAIL'.red);
					}
				}

				if (process.env.ADMIN_USERNAME) {
					let nameValidation;

					try {
						nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
					} catch (error) {
						nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
					}

					if (nameValidation.test(process.env.ADMIN_USERNAME)) {
						if (RocketChat.checkUsernameAvailability(process.env.ADMIN_USERNAME)) {
							adminUser.username = process.env.ADMIN_USERNAME;
						} else {
							console.log('Username provided already exists; Ignoring environment variables ADMIN_USERNAME'.red);
						}
					} else {
						console.log('Username provided is invalid; Ignoring environment variables ADMIN_USERNAME'.red);
					}
				}

				console.log((`Username: ${ adminUser.username }`).green);

				adminUser.type = 'user';

				const id = RocketChat.models.Users.create(adminUser);

				Accounts.setPassword(id, process.env.ADMIN_PASS);

				console.log((`Password: ${ process.env.ADMIN_PASS }`).green);

				RocketChat.authz.addUserRoles(id, 'admin');
			} else {
				console.log('Users with admin role already exist; Ignoring environment variables ADMIN_PASS'.red);
			}
		}

		if (typeof process.env.INITIAL_USER === 'string' && process.env.INITIAL_USER.length > 0) {
			try {
				const initialUser = JSON.parse(process.env.INITIAL_USER);

				if (!initialUser._id) {
					console.log('No _id provided; Ignoring environment variable INITIAL_USER'.red);
				} else if (!RocketChat.models.Users.findOneById(initialUser._id)) {
					console.log('Inserting initial user:'.green);
					console.log(JSON.stringify(initialUser, null, 2).green);
					RocketChat.models.Users.create(initialUser);
				}
			} catch (e) {
				console.log('Error processing environment variable INITIAL_USER'.red, e);
			}
		}

		if (_.isEmpty(RocketChat.authz.getUsersInRole('admin').fetch())) {
			const oldestUser = RocketChat.models.Users.findOne({
				_id: {
					$ne: 'rocket.cat'
				}
			}, {
				fields: {
					username: 1
				},
				sort: {
					createdAt: 1
				}
			});

			if (oldestUser) {
				RocketChat.authz.addUserRoles(oldestUser._id, 'admin');
				console.log(`No admins are found. Set ${ oldestUser.username } as admin for being the oldest user`);
			}
		}

		RocketChat.models.Users.removeById('rocketchat.internal.admin.test');

		if (process.env.TEST_MODE === 'true') {
			console.log('Inserting admin test user:'.green);

			const adminUser = {
				_id: 'rocketchat.internal.admin.test',
				name: 'RocketChat Internal Admin Test',
				username: 'rocketchat.internal.admin.test',
				emails: [
					{
						address: 'rocketchat.internal.admin.test@rocket.chat',
						verified: true
					}
				],
				status: 'offline',
				statusDefault: 'online',
				utcOffset: 0,
				active: true,
				type: 'user'
			};

			console.log((`Name: ${ adminUser.name }`).green);
			console.log((`Email: ${ adminUser.emails[0].address }`).green);
			console.log((`Username: ${ adminUser.username }`).green);
			console.log((`Password: ${ adminUser._id }`).green);

			if (RocketChat.models.Users.db.findOneByEmailAddress(adminUser.emails[0].address)) {
				throw new Meteor.Error(`Email ${ adminUser.emails[0].address } already exists`, 'Rocket.Chat can\'t run in test mode');
			}

			if (!RocketChat.checkUsernameAvailability(adminUser.username)) {
				throw new Meteor.Error(`Username ${ adminUser.username } already exists`, 'Rocket.Chat can\'t run in test mode');
			}

			RocketChat.models.Users.create(adminUser);

			Accounts.setPassword(adminUser._id, adminUser._id);

			RocketChat.authz.addUserRoles(adminUser._id, 'admin');

			return RocketChat.addUserToDefaultChannels(adminUser, true);
		}
	});
});
