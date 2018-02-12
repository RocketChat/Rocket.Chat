import { Importers } from 'meteor/rocketchat:importer';
import toastr from 'toastr';

Template.adminImportPrepare.helpers({
	isAdmin() {
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin');
	},
	importer() {
		const importerKey = FlowRouter.getParam('importer');

		return Importers.get(importerKey);
	},
	isLoaded() {
		return Template.instance().loaded.get();
	},
	isPreparing() {
		return Template.instance().preparing.get();
	},
	users() {
		return Template.instance().users.get();
	},
	channels() {
		return Template.instance().channels.get();
	},
	message_count() {
		return Template.instance().message_count.get();
	}
});

Template.adminImportPrepare.events({
	'change .import-file-input'(event, template) {
		const importer = this;
		if (!importer || !importer.key) { return; }

		const e = event.originalEvent || event;
		let { files } = e.target;
		if (!files || (files.length === 0)) {
			files = (e.dataTransfer != null ? e.dataTransfer.files : undefined) || [];
		}

		return Array.from(files).map((file) => {
			template.preparing.set(true);

			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onloadend = () => {
				Meteor.call('prepareImport', importer.key, reader.result, file.type, file.name, function(error, data) {
					if (error) {
						toastr.error(t('Invalid_Import_File_Type'));
						template.preparing.set(false);
						return;
					}

					if (!data) {
						console.warn(`The importer ${ importer.key } is not set up correctly, as it did not return any data.`);
						toastr.error(t('Importer_not_setup'));
						template.preparing.set(false);
						return;
					}

					if (data.step) {
						console.warn('Invalid file, contains `data.step`.', data);
						toastr.error(t('Invalid_Export_File', importer.key));
						template.preparing.set(false);
						return;
					}

					template.users.set(data.users);
					template.channels.set(data.channels);
					template.message_count.set(data.message_count);
					template.loaded.set(true);
					template.preparing.set(false);
				});
			};
		});
	},

	'click .button.start'(event, template) {
		const btn = this;
		$(btn).prop('disabled', true);
		for (const user of Array.from(template.users.get())) {
			user.do_import = $(`[name=${ user.user_id }]`).is(':checked');
		}

		for (const channel of Array.from(template.channels.get())) {
			channel.do_import = $(`[name=${ channel.channel_id }]`).is(':checked');
		}

		Meteor.call('startImport', FlowRouter.getParam('importer'), { users: template.users.get(), channels: template.channels.get() }, function(error) {
			if (error) {
				console.warn('Error on starting the import:', error);
				handleError(error);
			} else {
				FlowRouter.go(`/admin/import/progress/${ FlowRouter.getParam('importer') }`);
			}
		});
	},

	'click .button.restart'(event, template) {
		Meteor.call('restartImport', FlowRouter.getParam('importer'), function(error) {
			if (error) {
				console.warn('Error while restarting the import:', error);
				handleError(error);
				return;
			}

			template.users.set([]);
			template.channels.set([]);
			template.loaded.set(false);
		});
	},

	'click .button.uncheck-deleted-users'(event, template) {
		Array.from(template.users.get()).filter((user) => user.is_deleted).map((user) =>
			$(`[name=${ user.user_id }]`).attr('checked', false));
	},

	'click .button.uncheck-archived-channels'(event, template) {
		Array.from(template.channels.get()).filter((channel) => channel.is_archived).map((channel) =>
			$(`[name=${ channel.channel_id }]`).attr('checked', false));
	}
});


Template.adminImportPrepare.onCreated(function() {
	const instance = this;
	this.preparing = new ReactiveVar(true);
	this.loaded = new ReactiveVar(false);
	this.users = new ReactiveVar([]);
	this.channels = new ReactiveVar([]);
	this.message_count = new ReactiveVar(0);

	function loadSelection(progress) {
		if ((progress != null ? progress.step : undefined)) {
			switch (progress.step) {
				//When the import is running, take the user to the progress page
				case 'importer_importing_started':
				case 'importer_importing_users':
				case 'importer_importing_channels':
				case 'importer_importing_messages':
				case 'importer_finishing':
					return FlowRouter.go(`/admin/import/progress/${ FlowRouter.getParam('importer') }`);
				case 'importer_user_selection':
					return Meteor.call('getSelectionData', FlowRouter.getParam('importer'), function(error, data) {
						if (error) {
							handleError(error);
						}
						instance.users.set(data.users);
						instance.channels.set(data.channels);
						instance.message_count.set(data.message_count);
						instance.loaded.set(true);
						return instance.preparing.set(false);
					});
				case 'importer_new':
					return instance.preparing.set(false);
				default:
					return Meteor.call('restartImport', FlowRouter.getParam('importer'), function(error, progress) {
						if (error) {
							handleError(error);
						}
						return loadSelection(progress);
					});
			}
		} else {
			return console.warn('Invalid progress information.', progress);
		}
	}

	// Load the initial progress to determine what we need to do
	if (FlowRouter.getParam('importer')) {
		return Meteor.call('getImportProgress', FlowRouter.getParam('importer'), function(error, progress) {
			if (error) {
				console.warn('Error while getting the import progress:', error);
				handleError(error);
				return;
			}

			// if the progress isnt defined, that means there currently isn't an instance
			// of the importer, so we need to create it
			if (progress === undefined) {
				return Meteor.call('setupImporter', FlowRouter.getParam('importer'), function(err, data) {
					if (err) {
						handleError(err);
					}
					instance.preparing.set(false);
					return loadSelection(data);
				});
			} else {
				// Otherwise, we might need to do something based upon the current step
				// of the import
				return loadSelection(progress);
			}
		});
	} else {
		return FlowRouter.go('/admin/import');
	}
});
