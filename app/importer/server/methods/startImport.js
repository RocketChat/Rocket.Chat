import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Imports } from '../../../models';

import {
	Importers,
	Selection,
	SelectionChannel,
	SelectionUser,
} from '..';


Meteor.methods({
	startImport(key, input) {
		// Takes name and object with users / channels selected to import
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'startImport' });
		}

		if (!hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'startImport' });
		}

		if (!key) {
			throw new Meteor.Error('error-invalid-importer', `No defined importer by: "${ key }"`, { method: 'startImport' });
		}

		const operation = Imports.findLastImport();
		if (!operation) {
			throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', { method: 'startImport' });
		}

		if (key !== operation.importerKey) {
			throw new Meteor.Error('error-operation-expired', 'Import Operation is Expired', { method: 'startImport' });
		}

		const importer = Importers.get(key);
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ key }) has no import class defined.`, { method: 'startImport' });
		}

		importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

		const usersSelection = input.users.map((user) => new SelectionUser(user.user_id, user.username, user.email, user.is_deleted, user.is_bot, user.do_import));
		const channelsSelection = input.channels.map((channel) => new SelectionChannel(channel.channel_id, channel.name, channel.is_archived, channel.do_import));

		const selection = new Selection(importer.name, usersSelection, channelsSelection);
		return importer.instance.startImport(selection);
	},
});
