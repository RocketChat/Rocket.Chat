import {
	Importers,
	Selection,
	SelectionChannel,
	SelectionUser
} from 'meteor/rocketchat:importer';

Meteor.methods({
	startImport(key, input) {
		// Takes name and object with users / channels selected to import
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'startImport' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'startImport'});
		}

		if (!key) {
			throw new Meteor.Error('error-invalid-importer', `No defined importer by: "${ key }"`, { method: 'startImport' });
		}

		const importer = Importers.get(key);

		if (!importer || !importer.instance) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ key }) has no import class defined.`, { method: 'startImport' });
		}

		const usersSelection = input.users.map(user => new SelectionUser(user.user_id, user.username, user.email, user.is_deleted, user.is_bot, user.do_import));
		const channelsSelection = input.channels.map(channel => new SelectionChannel(channel.channel_id, channel.name, channel.is_archived, channel.do_import));

		const selection = new Selection(importer.name, usersSelection, channelsSelection);
		return importer.instance.startImport(selection);
	}
});
