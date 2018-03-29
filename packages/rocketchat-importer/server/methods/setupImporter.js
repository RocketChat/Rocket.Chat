import { Importers } from 'meteor/rocketchat:importer';

Meteor.methods({
	setupImporter(key) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setupImporter' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});
		}

		const importer = Importers.get(key);

		if (!importer) {
			console.warn(`Tried to setup ${ name } as an importer.`);
			throw new Meteor.Error('error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'setupImporter' });
		}

		if (importer.instance) {
			return importer.instance.getProgress();
		}

		importer.instance = new importer.importer(importer); //eslint-disable-line new-cap
		return importer.instance.getProgress();
	}
});
