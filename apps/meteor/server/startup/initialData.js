import { Settings, Rooms, Users, Roles } from '@rocket.chat/models';
import colors from 'colors/safe';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { RocketChatFile } from '../../app/file/server';
import { FileUpload } from '../../app/file-upload/server';
import { addUserToDefaultChannels } from '../../app/lib/server/functions/addUserToDefaultChannels';
import { checkUsernameAvailability } from '../../app/lib/server/functions/checkUsernameAvailability';
import { notifyOnSettingChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';
import { validateEmail } from '../../lib/emailValidator';
import { addUserRolesAsync } from '../lib/roles/addUserRoles';

export async function insertAdminUserFromEnv() {
	if (process.env.ADMIN_PASS) {
		if ((await Roles.countUsersInRole('admin')) === 0) {
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

			console.log(colors.green(`Name: ${adminUser.name}`));

			if (process.env.ADMIN_EMAIL) {
				if (validateEmail(process.env.ADMIN_EMAIL)) {
					if (!(await Users.findOneByEmailAddress(process.env.ADMIN_EMAIL))) {
						adminUser.emails = [
							{
								address: process.env.ADMIN_EMAIL,
								verified: process.env.ADMIN_EMAIL_VERIFIED === 'true',
							},
						];

						console.log(colors.green(`Email: ${process.env.ADMIN_EMAIL}`));
					} else {
						console.log(colors.red('Email provided already exists; Ignoring environment variables ADMIN_EMAIL'));
					}
				} else {
					console.log(colors.red('Email provided is invalid; Ignoring environment variables ADMIN_EMAIL'));
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
					try {
						await checkUsernameAvailability(process.env.ADMIN_USERNAME);
						adminUser.username = process.env.ADMIN_USERNAME;
					} catch (error) {
						console.log(
							colors.red('Username provided already exists or is blocked from usage; Ignoring environment variables ADMIN_USERNAME'),
						);
					}
				} else {
					console.log(colors.red('Username provided is invalid; Ignoring environment variables ADMIN_USERNAME'));
				}
			}

			console.log(colors.green(`Username: ${adminUser.username}`));

			adminUser.type = 'user';

			const { insertedId: userId } = await Users.create(adminUser);

			await Accounts.setPasswordAsync(userId, process.env.ADMIN_PASS);

			await addUserRolesAsync(userId, ['admin']);
		} else {
			console.log(colors.red('Users with admin role already exist; Ignoring environment variables ADMIN_PASS'));
		}
	}
}

Meteor.startup(async () => {
	const dynamicImport = {
		'dynamic-import': {
			useLocationOrigin: true,
		},
	};

	if (!Meteor.settings) {
		Meteor.settings = {
			public: {
				packages: {
					'dynamic-import': dynamicImport,
				},
			},
		};
	}

	if (!Meteor.settings.public) {
		Meteor.settings.public = {
			packages: {
				'dynamic-import': dynamicImport,
			},
		};
	}

	if (!Meteor.settings.public.packages) {
		Meteor.settings.public.packages = dynamicImport;
	}

	Meteor.settings.public.packages['dynamic-import'] = dynamicImport['dynamic-import'];

	if (!settings.get('Initial_Channel_Created')) {
		const exists = await Rooms.findOneById('GENERAL', { projection: { _id: 1 } });
		if (!exists) {
			await Rooms.createWithIdTypeAndName('GENERAL', 'c', 'general', {
				default: true,
			});
		}

		(await Settings.updateValueById('Initial_Channel_Created', true)).modifiedCount &&
			void notifyOnSettingChangedById('Initial_Channel_Created');
	}

	try {
		if (!(await Users.findOneById('rocket.cat', { projection: { _id: 1 } }))) {
			await Users.create({
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

			const buffer = Buffer.from(await Assets.getBinaryAsync('avatars/rocketcat.png'));

			const rs = RocketChatFile.bufferToStream(buffer, 'utf8');
			const fileStore = FileUpload.getStore('Avatars');
			await fileStore.deleteByName('rocket.cat');

			const file = {
				userId: 'rocket.cat',
				type: 'image/png',
				size: buffer.length,
			};

			const upload = await fileStore.insert(file, rs);
			await Users.setAvatarData('rocket.cat', 'local', upload.etag);
		}
	} catch (error) {
		console.log(
			'Error creating default `rocket.cat` user, if you created a user with this username please remove it and restart the server',
		);
		throw error;
	}

	await insertAdminUserFromEnv();

	if (typeof process.env.INITIAL_USER === 'string' && process.env.INITIAL_USER.length > 0) {
		try {
			const initialUser = JSON.parse(process.env.INITIAL_USER);

			if (!initialUser._id) {
				console.log(colors.red('No _id provided; Ignoring environment variable INITIAL_USER'));
			} else if (!(await Users.findOneById(initialUser._id))) {
				console.log(colors.green('Inserting initial user:'));
				console.log(colors.green(JSON.stringify(initialUser, null, 2)));
				await Users.create(initialUser);

				await addUserToDefaultChannels(initialUser, true);
			}
		} catch (e) {
			console.log(colors.red('Error processing environment variable INITIAL_USER'), e);
		}
	}

	if ((await Roles.countUsersInRole('admin')) === 0) {
		const oldestUser = await Users.getOldest({ projection: { _id: 1, username: 1, name: 1 } });

		if (oldestUser) {
			await addUserRolesAsync(oldestUser._id, ['admin']);
			console.log(`No admins are found. Set ${oldestUser.username || oldestUser.name} as admin for being the oldest user`);
		}
	}

	if ((await Roles.countUsersInRole('admin')) !== 0) {
		if (settings.get('Show_Setup_Wizard') === 'pending') {
			console.log('Setting Setup Wizard to "in_progress" because, at least, one admin was found');

			(await Settings.updateValueById('Show_Setup_Wizard', 'in_progress')).modifiedCount &&
				void notifyOnSettingChangedById('Show_Setup_Wizard');
		}
	}

	await Users.removeById('rocketchat.internal.admin.test');

	if (process.env.TEST_MODE === 'true') {
		console.log(colors.green('Inserting admin test user:'));

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

		console.log(colors.green(`Name: ${adminUser.name}`));
		console.log(colors.green(`Email: ${adminUser.emails[0].address}`));
		console.log(colors.green(`Username: ${adminUser.username}`));
		console.log(colors.green(`Password: ${adminUser._id}`));

		if (await Users.findOneByEmailAddress(adminUser.emails[0].address)) {
			throw new Meteor.Error(`Email ${adminUser.emails[0].address} already exists`, "Rocket.Chat can't run in test mode");
		}

		if (!(await checkUsernameAvailability(adminUser.username))) {
			throw new Meteor.Error(`Username ${adminUser.username} already exists`, "Rocket.Chat can't run in test mode");
		}

		await Users.create(adminUser);

		await Accounts.setPasswordAsync(adminUser._id, adminUser._id);

		await addUserRolesAsync(adminUser._id, ['admin']);

		if (settings.get('Show_Setup_Wizard') === 'pending') {
			(await Settings.updateValueById('Show_Setup_Wizard', 'in_progress')).modifiedCount &&
				void notifyOnSettingChangedById('Show_Setup_Wizard');
		}

		return addUserToDefaultChannels(adminUser, true);
	}
});
