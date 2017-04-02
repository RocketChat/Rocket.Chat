/* globals Importer */

Meteor.methods({
	prepareImport(name, dataURI, contentType, fileName) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'prepareImport' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});
		}

		check(name, String);
		check(dataURI, String);
		check(fileName, String);

		if (name && Importer.Importers[name] && Importer.Importers[name].importerInstance) {
			const results = Importer.Importers[name].importerInstance.prepare(dataURI, contentType, fileName);

			if (typeof results === 'object') {
				if (results instanceof Promise) {
					return results.catch(e => { throw new Meteor.Error(e); });
				} else {
					return results;
				}
			}
		} else if (!name) {
			throw new Meteor.Error('error-importer-not-defined', `No Importer Found: "${ name }"`, { method: 'prepareImport' });
		} else {
			throw new Meteor.Error('error-importer-not-defined', `The importer, "${ name }", was not defined correctly, it is missing the Import class.`, { method: 'prepareImport' });
		}
	}
});
