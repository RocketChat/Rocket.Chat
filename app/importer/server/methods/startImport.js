import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Imports } from '../../../models';
import { Importers, Selection, SelectionChannel, SelectionUser } from '..';

Meteor.methods({
	startImport(input) {
		// Takes name and object with users / channels selected to import
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'startImport' });
		}

		if (!hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', {
				method: 'startImport',
			});
		}

		const operation = Imports.findLastImport();
		if (!operation) {
			throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', {
				method: 'startImport',
			});
		}

		const { importerKey } = operation;
		const importer = Importers.get(importerKey);
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, {
				method: 'startImport',
			});
		}

		importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

		const usersSelection = input.users.map(
			(user) => new SelectionUser(user.user_id, user.username, user.email, user.is_deleted, user.is_bot, user.do_import),
		);
		const channelsSelection = input.channels.map(
			(channel) => new SelectionChannel(channel.channel_id, channel.name, channel.is_archived, channel.do_import),
		);

		const selection = new Selection(importer.name, usersSelection, channelsSelection);
		return importer.instance.startImport(selection);
	},
});
