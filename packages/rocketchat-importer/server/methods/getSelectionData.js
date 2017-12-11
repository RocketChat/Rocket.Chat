import {
	Importers,
	ProgressStep
} from 'meteor/rocketchat:importer';

Meteor.methods({
	getSelectionData(key) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getSelectionData' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});
		}

		const importer = Importers.get(key);

		if (!importer || !importer.instance) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ key }) has no import class defined.`, { method: 'getSelectionData' });
		}

		const progress = importer.instance.getProgress();

		switch (progress.step) {
			case ProgressStep.USER_SELECTION:
				return importer.instance.getSelection();
			default:
				return undefined;
		}
	}
});
