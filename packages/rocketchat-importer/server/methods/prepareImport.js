import { Importers } from 'meteor/rocketchat:importer';

Meteor.methods({
	prepareImport(key, dataURI, contentType, fileName) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'prepareImport' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});
		}

		check(key, String);
		check(dataURI, String);
		check(fileName, String);

		const importer = Importers.get(key);

		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ key }) has no import class defined.`, { method: 'prepareImport' });
		}

		const results = importer.instance.prepare(dataURI, contentType, fileName);

		if (results instanceof Promise) {
			return results.catch(e => { throw new Meteor.Error(e); });
		} else {
			return results;
		}
	}
});
