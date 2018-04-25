import {
	Base,
	ProgressStep,
	Selection,
	SelectionUser
} from 'meteor/rocketchat:importer';

export class SlackUsersImporter extends Base {
	constructor(info) {
		super(info);

		this.csvParser = require('csv-parse/lib/sync');
		this.userMap = new Map();
		this.admins = []; //Array of ids of the users which are admins
	}

	prepare(dataURI, sentContentType, fileName) {
		super.prepare(dataURI, sentContentType, fileName, true);

		super.updateProgress(ProgressStep.PREPARING_USERS);
		const uriResult = RocketChatFile.dataURIParse(dataURI);
		const buf = new Buffer(uriResult.image, 'base64');
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

		const usersId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'users', 'users': userArray });
		this.users = this.collection.findOne(usersId);
		super.updateRecord({ 'count.users': this.userMap.size });
		super.addCountToTotal(this.userMap.size);

		if (this.userMap.size === 0) {
			this.logger.error('No users found in the import file.');
			super.updateProgress(ProgressStep.ERROR);
			return super.getProgress();
		}

		super.updateProgress(ProgressStep.USER_SELECTION);
		return new Selection(this.name, userArray, [], 0);
	}

	startImport(importSelection) {
		super.startImport(importSelection);
		const started = Date.now();

		for (const user of importSelection.users) {
			const u = this.userMap.get(user.user_id);
			u.do_import = user.do_import;

			this.userMap.set(user.user_id, u);
		}
		this.collection.update({ _id: this.users._id }, { $set: { 'users': Array.from(this.userMap.values()) }});

		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			super.updateProgress(ProgressStep.IMPORTING_USERS);

			try {
				for (const u of this.users.users) {
					if (!u.do_import) {
						continue;
					}

					Meteor.runAsUser(startedByUserId, () => {
						const existantUser = RocketChat.models.Users.findOneByEmailAddress(u.email) || RocketChat.models.Users.findOneByUsername(u.username);

						let userId;
						if (existantUser) {
							//since we have an existing user, let's try a few things
							userId = existantUser._id;
							u.rocketId = existantUser._id;
							RocketChat.models.Users.update({ _id: u.rocketId }, { $addToSet: { importIds: u.id } });

							RocketChat.models.Users.setEmail(existantUser._id, u.email);
							RocketChat.models.Users.setEmailVerified(existantUser._id, u.email);
						} else {
							userId = Accounts.createUser({ username: u.username + Random.id(), password: Date.now() + u.name + u.email.toUpperCase() });

							if (!userId) {
								console.warn('An error happened while creating a user.');
								return;
							}

							Meteor.runAsUser(userId, () => {
								Meteor.call('setUsername', u.username, {joinDefaultChannelsSilenced: true});
								RocketChat.models.Users.setName(userId, u.name);
								RocketChat.models.Users.update({ _id: userId }, { $addToSet: { importIds: u.id } });
								RocketChat.models.Users.setEmail(userId, u.email);
								RocketChat.models.Users.setEmailVerified(userId, u.email);
								u.rocketId = userId;
							});
						}

						if (this.admins.includes(u.user_id)) {
							Meteor.call('setAdminStatus', userId, true);
						}

						super.addCountCompleted(1);
					});
				}

				super.updateProgress(ProgressStep.FINISHING);
				super.updateProgress(ProgressStep.DONE);
			} catch (e) {
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}

			const timeTook = Date.now() - started;
			this.logger.log(`Slack Users Import took ${ timeTook } milliseconds.`);
		});

		return super.getProgress();
	}
}
