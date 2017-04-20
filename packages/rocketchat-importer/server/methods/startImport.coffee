Meteor.methods
	startImport: (name, input) ->
		# Takes name and object with users / channels selected to import
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'startImport' }

		if not RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});

		if Importer.Importers[name]?.importerInstance?
			usersSelection = input.users.map (user) ->
				return new Importer.SelectionUser user.user_id, user.username, user.email, user.is_deleted, user.is_bot, user.do_import
			channelsSelection = input.channels.map (channel) ->
				return new Importer.SelectionChannel channel.channel_id, channel.name, channel.is_archived, channel.do_import

			selection = new Importer.Selection name, usersSelection, channelsSelection
			Importer.Importers[name].importerInstance.startImport selection
		else
			throw new Meteor.Error 'error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'startImport' }
