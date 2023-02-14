import { Meteor } from 'meteor/meteor';
import type { StartImportParamsPOST } from '@rocket.chat/rest-typings';

import { hasPermission } from '../../../authorization/server';
import { Imports } from '../../../models/server';
import { Importers, Selection, SelectionChannel, SelectionUser } from '..';

export const executeStartImport = ({ input }: StartImportParamsPOST) => {
	const operation = Imports.findLastImport();
	if (!operation) {
		throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', 'startImport');
	}

	const { importerKey } = operation;
	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'startImport');
	}

	importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	const usersSelection = input.users.map(
		(user) => new SelectionUser(user.user_id, user.username, user.email, user.is_deleted, user.is_bot, user.do_import),
	);
	const channelsSelection = input.channels.map(
		(channel) =>
			new SelectionChannel(
				channel.channel_id,
				channel.name,
				channel.is_archived,
				channel.do_import,
				channel.is_private,
				channel.creator,
				channel.is_direct,
			),
	);
	const selection = new Selection(importer.name, usersSelection, channelsSelection, 0);
	return importer.instance.startImport(selection);
};

Meteor.methods({
	startImport({ input }: StartImportParamsPOST) {
		const userId = Meteor.userId();
		// Takes name and object with users / channels selected to import
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'startImport');
		}

		if (!hasPermission(userId, 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'startImport');
		}

		return executeStartImport({ input });
	},
});
