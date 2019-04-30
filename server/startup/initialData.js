import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { RocketChatFile } from '../../app/file';
import { FileUpload } from '../../app/file-upload';
import { addUserRoles, getUsersInRole } from '../../app/authorization';
import { Users, Settings, Rooms } from '../../app/models';
import { settings } from '../../app/settings';
import { checkUsernameAvailability, addUserToDefaultChannels } from '../../app/lib';
import _ from 'underscore';

Meteor.startup(function() {
	Meteor.defer(() => {
		if (!Rooms.findOneById('GENERAL')) {
			Rooms.createWithIdTypeAndName('GENERAL', 'c', 'general', {
				default: true,
			});
		}

		if (!Users.findOneById('rocket.cat')) {
			Users.create({
				_id: 'rocket.cat',
				name: 'Rocket.Cat',
				username: 'rocket.cat',
				status: 'online',
				statusDefault: 'online',
				utcOffset: 0,
				active: true,
				type: 'bot',
			});

			addUserRoles('rocket.cat', 'bot');

			const rs = RocketChatFile.bufferToStream(new Buffer(Assets.getBinary('avatars/rocketcat.png'), 'utf8'));
			const fileStore = FileUpload.getStore('Avatars');
			fileStore.deleteByName('rocket.cat');

			const file = {
				userId: 'rocket.cat',
				type: 'image/png',
			};

			Meteor.runAsUser('rocket.cat', () => {
				fileStore.insert(file, rs, () => Users.setAvatarOrigin('rocket.cat', 'local'));
			});
		}

		if (process.env.ADMIN_PASS) {
			if (_.isEmpty(getUsersInRole('admin').fetch())) {
				console.log('Inserting admin user:'.green);
				const adminUser = {
					name: 'Administrator',
					username: 'admin',
					status: 'offline',
					statusDefault: 'online',
					utcOffset: 0,
					active: true,
				};

				if (process.env.ADMIN_NAME) {
					adminUser.name = process.env.ADMIN_NAME;
				}

				console.log(`Name: ${ adminUser.name }`.green);

				if (process.env.ADMIN_EMAIL) {
					const re = /^[^@].*@[^@]+$/i;

					if (re.test(process.env.ADMIN_EMAIL)) {
						if (!Users.findOneByEmailAddress(process.env.ADMIN_EMAIL)) {
							adminUser.emails = [{
								address: process.env.ADMIN_EMAIL,
								verified: true,
							}];

							console.log(`Email: ${ process.env.ADMIN_EMAIL }`.green);
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
						nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
					} catch (error) {
						nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
					}

					if (nameValidation.test(process.env.ADMIN_USERNAME)) {
						if (checkUsernameAvailability(process.env.ADMIN_USERNAME)) {
							adminUser.username = process.env.ADMIN_USERNAME;
						} else {
							console.log('Username provided already exists; Ignoring environment variables ADMIN_USERNAME'.red);
						}
					} else {
						console.log('Username provided is invalid; Ignoring environment variables ADMIN_USERNAME'.red);
					}
				}

				console.log(`Username: ${ adminUser.username }`.green);

				adminUser.type = 'user';

				const id = Users.create(adminUser);

				Accounts.setPassword(id, process.env.ADMIN_PASS);

				console.log(`Password: ${ process.env.ADMIN_PASS }`.green);

				addUserRoles(id, 'admin');
			} else {
				console.log('Users with admin role already exist; Ignoring environment variables ADMIN_PASS'.red);
			}
		}

		if (typeof process.env.INITIAL_USER === 'string' && process.env.INITIAL_USER.length > 0) {
			try {
				const initialUser = JSON.parse(process.env.INITIAL_USER);

				if (!initialUser._id) {
					console.log('No _id provided; Ignoring environment variable INITIAL_USER'.red);
				} else if (!Users.findOneById(initialUser._id)) {
					console.log('Inserting initial user:'.green);
					console.log(JSON.stringify(initialUser, null, 2).green);
					Users.create(initialUser);
				}
			} catch (e) {
				console.log('Error processing environment variable INITIAL_USER'.red, e);
			}
		}

		if (_.isEmpty(getUsersInRole('admin').fetch())) {
			const oldestUser = Users.getOldest({ _id: 1, username: 1, name: 1 });

			if (oldestUser) {
				addUserRoles(oldestUser._id, 'admin');
				console.log(`No admins are found. Set ${ oldestUser.username || oldestUser.name } as admin for being the oldest user`);
			}
		}

		if (!_.isEmpty(getUsersInRole('admin').fetch())) {
			if (settings.get('Show_Setup_Wizard') === 'pending') {
				console.log('Setting Setup Wizard to "in_progress" because, at least, one admin was found');
				Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
			}
		}

		Users.removeById('rocketchat.internal.admin.test');

		if (process.env.TEST_MODE === 'true') {
			console.log('Inserting admin test user:'.green);

			const adminUser = {
				_id: 'rocketchat.internal.admin.test',
				name: 'RocketChat Internal Admin Test',
				username: 'rocketchat.internal.admin.test',
				emails: [
					{
						address: 'rocketchat.internal.admin.test@rocket.chat',
						verified: true,
					},
				],
				status: 'offline',
				statusDefault: 'online',
				utcOffset: 0,
				active: true,
				type: 'user',
			};

			console.log(`Name: ${ adminUser.name }`.green);
			console.log(`Email: ${ adminUser.emails[0].address }`.green);
			console.log(`Username: ${ adminUser.username }`.green);
			console.log(`Password: ${ adminUser._id }`.green);

			if (Users.findOneByEmailAddress(adminUser.emails[0].address)) {
				throw new Meteor.Error(`Email ${ adminUser.emails[0].address } already exists`, 'Rocket.Chat can\'t run in test mode');
			}

			if (!checkUsernameAvailability(adminUser.username)) {
				throw new Meteor.Error(`Username ${ adminUser.username } already exists`, 'Rocket.Chat can\'t run in test mode');
			}

			Users.create(adminUser);

			Accounts.setPassword(adminUser._id, adminUser._id);

			addUserRoles(adminUser._id, 'admin');

			if (settings.get('Show_Setup_Wizard') === 'pending') {
				Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
			}

			return addUserToDefaultChannels(adminUser, true);
		}
	});
});
