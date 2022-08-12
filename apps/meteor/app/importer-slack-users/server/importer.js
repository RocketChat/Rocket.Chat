import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { Settings } from '@rocket.chat/models';

import { RawImports, Base, ProgressStep, Selection, SelectionUser } from '../../importer/server';
import { RocketChatFile } from '../../file';
import { Users } from '../../models/server';

export class SlackUsersImporter extends Base {
	constructor(info, importRecord) {
		super(info, importRecord);

		const { parse } = require('csv-parse/lib/sync');

		this.csvParser = parse;
		this.userMap = new Map();
		this.admins = []; // Array of ids of the users which are admins
	}

	prepare(dataURI, sentContentType, fileName) {
		super.prepare(dataURI, sentContentType, fileName, true);

		super.updateProgress(ProgressStep.PREPARING_USERS);
		const uriResult = RocketChatFile.dataURIParse(dataURI);
		const buf = Buffer.from(uriResult.image, 'base64');
		const parsed = this.csvParser(buf.toString());

		parsed.forEach((user, index) => {
			// Ignore the first column
			if (index === 0) {
				return;
			}

			const id = Random.id();
			const username = user[0];
			const email = user[1];
			let isBot = false;
			let isDeleted = false;

			switch (user[2]) {
				case 'Admin':
					this.admins.push(id);
					break;
				case 'Bot':
					isBot = true;
					break;
				case 'Deactivated':
					isDeleted = true;
					break;
			}

			this.userMap.set(id, new SelectionUser(id, username, email, isDeleted, isBot, true));
		});

		const userArray = Array.from(this.userMap.values());

		const usersId = this.collection.insert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
			users: userArray,
		});
		this.users = this.collection.findOne(usersId);
		super.updateRecord({ 'count.users': this.userMap.size });
		super.addCountToTotal(this.userMap.size);

		if (this.userMap.size === 0) {
			this.logger.error('No users found in the import file.');
			super.updateProgress(ProgressStep.ERROR);
			return super.getProgress();
		}

		this.collection.insert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'admins',
			admins: this.admins,
		});

		super.updateProgress(ProgressStep.USER_SELECTION);
		return new Selection(this.name, userArray, [], 0);
	}

	startImport(importSelection) {
		const admins = this.collection.findOne({ import: this.importRecord._id, type: 'admins' });
		if (admins) {
			this.admins = admins.admins || [];
		} else {
			this.admins = [];
		}

		this.users = RawImports.findOne({ import: this.importRecord._id, type: 'users' });
		// Recreate the userMap from the collection data
		this.userMap = new Map();
		for (const user of this.users.users) {
			const obj = new SelectionUser();
			for (const propName in user) {
				if (user.hasOwnProperty(propName)) {
					obj[propName] = user[propName];
				}
			}
			this.userMap.set(user.user_id, obj);
		}

		this.reloadCount();

		super.startImport(importSelection);
		const started = Date.now();

		for (const user of importSelection.users) {
			const u = this.userMap.get(user.user_id);
			u.do_import = user.do_import;

			this.userMap.set(user.user_id, u);
		}
		this.collection.update({ _id: this.users._id }, { $set: { users: Array.from(this.userMap.values()) } });

		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			super.updateProgress(ProgressStep.IMPORTING_USERS);

			try {
				for (const u of this.users.users) {
					if (!u.do_import) {
						continue;
					}

					Meteor.runAsUser(startedByUserId, () => {
						const existantUser = Users.findOneByEmailAddress(u.email) || Users.findOneByUsernameIgnoringCase(u.username);

						let userId;
						if (existantUser) {
							// since we have an existing user, let's try a few things
							userId = existantUser._id;
							u.rocketId = existantUser._id;
							Users.update({ _id: u.rocketId }, { $addToSet: { importIds: u.user_id } });

							Users.setEmail(existantUser._id, u.email);
							Users.setEmailVerified(existantUser._id, u.email);
						} else {
							userId = Accounts.createUser({
								username: u.username + Random.id(),
								password: Date.now() + u.name + u.email.toUpperCase(),
							});

							if (!userId) {
								console.warn('An error happened while creating a user.');
								return;
							}

							Meteor.runAsUser(userId, () => {
								Meteor.call('setUsername', u.username, { joinDefaultChannelsSilenced: true });
								Users.setName(userId, u.name);
								Users.update({ _id: userId }, { $addToSet: { importIds: u.user_id } });
								Users.setEmail(userId, u.email);
								Users.setEmailVerified(userId, u.email);
								u.rocketId = userId;
							});
						}

						if (this.admins.includes(u.user_id)) {
							Meteor.call('setAdminStatus', userId, true);
						}

						super.addCountCompleted(1);
					});
				}

				Settings.incrementValueById('Slack_Users_Importer_Count', this.users.users.length);
				super.updateProgress(ProgressStep.FINISHING);
				super.updateProgress(ProgressStep.DONE);
			} catch (e) {
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}

			const timeTook = Date.now() - started;
			this.logger.log(`Slack Users Import took ${timeTook} milliseconds.`);
		});

		return super.getProgress();
	}
}
