import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { RocketChatFile } from '../../app/file';
import { FileUpload } from '../../app/file-upload/server';
import { getUsersInRole } from '../../app/authorization/server';
import { addUserRolesAsync } from '../lib/roles/addUserRoles';
import { Users, Rooms } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { checkUsernameAvailability, addUserToDefaultChannels } from '../../app/lib/server';
import { Settings } from '../../app/models/server/raw';
import { validateEmail } from '../../lib/emailValidator';

Meteor.startup(async function () {
	if (!settings.get('Initial_Channel_Created')) {
		const exists = Rooms.findOneById('GENERAL', { fields: { _id: 1 } });
		if (!exists) {
			Rooms.createWithIdTypeAndName('GENERAL', 'c', 'general', {
				default: true,
			});
		}

		Settings.updateValueById('Initial_Channel_Created', true);
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

		await addUserRolesAsync('rocket.cat', ['bot']);

		const buffer = Buffer.from(Assets.getBinary('avatars/rocketcat.png'));

		const rs = RocketChatFile.bufferToStream(buffer, 'utf8');
		const fileStore = FileUpload.getStore('Avatars');
		fileStore.deleteByName('rocket.cat');

		const file = {
			userId: 'rocket.cat',
			type: 'image/png',
			size: buffer.length,
		};

		Meteor.runAsUser('rocket.cat', () => {
			fileStore.insert(file, rs, () => Users.setAvatarData('rocket.cat', 'local', null));
		});
	}

	if (process.env.ADMIN_PASS) {
		if ((await (await getUsersInRole('admin')).count()) === 0) {
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

			console.log(`Name: ${adminUser.name}`.green);

			if (process.env.ADMIN_EMAIL) {
				if (validateEmail(process.env.ADMIN_EMAIL)) {
					if (!Users.findOneByEmailAddress(process.env.ADMIN_EMAIL)) {
						adminUser.emails = [
							{
								address: process.env.ADMIN_EMAIL,
								verified: process.env.ADMIN_EMAIL_VERIFIED === 'true',
							},
						];

						console.log(`Email: ${process.env.ADMIN_EMAIL}`.green);
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
					nameValidation = new RegExp(`^${settings.get('UTF8_User_Names_Validation')}$`);
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

			console.log(`Username: ${adminUser.username}`.green);

			adminUser.type = 'user';

			const id = Users.create(adminUser);

			Accounts.setPassword(id, process.env.ADMIN_PASS);

			await addUserRolesAsync(id, ['admin']);
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

				await addUserToDefaultChannels(initialUser, true);
			}
		} catch (e) {
			console.log('Error processing environment variable INITIAL_USER'.red, e);
		}
	}

	if ((await (await getUsersInRole('admin')).count()) === 0) {
		const oldestUser = Users.getOldest({ _id: 1, username: 1, name: 1 });

		if (oldestUser) {
			await addUserRolesAsync(oldestUser._id, ['admin']);
			console.log(`No admins are found. Set ${oldestUser.username || oldestUser.name} as admin for being the oldest user`);
		}
	}

	if ((await (await getUsersInRole('admin')).count()) !== 0) {
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
					verified: false,
				},
			],
			status: 'offline',
			statusDefault: 'online',
			utcOffset: 0,
			active: true,
			type: 'user',
		};

		console.log(`Name: ${adminUser.name}`.green);
		console.log(`Email: ${adminUser.emails[0].address}`.green);
		console.log(`Username: ${adminUser.username}`.green);
		console.log(`Password: ${adminUser._id}`.green);

		if (Users.findOneByEmailAddress(adminUser.emails[0].address)) {
			throw new Meteor.Error(`Email ${adminUser.emails[0].address} already exists`, "Rocket.Chat can't run in test mode");
		}

		if (!checkUsernameAvailability(adminUser.username)) {
			throw new Meteor.Error(`Username ${adminUser.username} already exists`, "Rocket.Chat can't run in test mode");
		}

		Users.create(adminUser);

		Accounts.setPassword(adminUser._id, adminUser._id);

		await addUserRolesAsync(adminUser._id, ['admin']);

		if (settings.get('Show_Setup_Wizard') === 'pending') {
			Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
		}

		return addUserToDefaultChannels(adminUser, true);
	}
});
