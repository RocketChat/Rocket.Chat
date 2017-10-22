/* globals Importer */
Meteor.methods({
	startImport(name, input) {
		// Takes name and object with users / channels selected to import
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'startImport' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'startImport'});
		}

		if (!name) {
			throw new Meteor.Error('error-invalid-importer', `No defined importer by: "${ name }"`, { method: 'startImport' });
		}

		if (Importer.Importers[name] && Importer.Importers[name].importerInstance) {
			const usersSelection = input.users.map(user => new Importer.SelectionUser(user.user_id, user.username, user.email, user.is_deleted, user.is_bot, user.do_import));
			const channelsSelection = input.channels.map(channel => new Importer.SelectionChannel(channel.channel_id, channel.name, channel.is_archived, channel.do_import));

			const selection = new Importer.Selection(name, usersSelection, channelsSelection);
			return Importer.Importers[name].importerInstance.startImport(selection);
		} else {
			throw new Meteor.Error('error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'startImport' });
		}
	}});
