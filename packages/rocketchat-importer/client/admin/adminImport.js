import { Importers } from 'meteor/rocketchat:importer';

Template.adminImport.helpers({
	isAdmin() {
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin');
	},
	getDescription(importer) {
		return TAPi18n.__('Importer_From_Description', { from: importer.name });
	},
	importers() {
		return Importers.getAll();
	}
});

Template.adminImport.events({
	'click .start-import'() {
		const importer = this;

		Meteor.call('setupImporter', importer.key, function(error) {
			if (error) {
				console.log(t('importer_setup_error'), importer.key, error);
				handleError(error);
				return;
			}

			FlowRouter.go(`/admin/import/prepare/${ importer.key }`);
		});
	}
});
