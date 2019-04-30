import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Importers } from '..';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { hasRole } from '../../../authorization';
import { settings } from '../../../settings';
import { t, handleError, APIClient } from '../../../utils';
import toastr from 'toastr';
import { SideNav } from '../../../ui-utils/client';

Template.adminImportPrepare.helpers({
	isAdmin() {
		return hasRole(Meteor.userId(), 'admin');
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
	},
	fileSizeLimitMessage() {
		const maxFileSize = settings.get('FileUpload_MaxFileSize');
		let message;

		if (maxFileSize > 0) {
			const sizeInKb = maxFileSize / 1024;
			const sizeInMb = sizeInKb / 1024;

			let fileSizeMessage;
			if (sizeInMb > 0) {
				fileSizeMessage = TAPi18n.__('FileSize_MB', { fileSize: sizeInMb.toFixed(2) });
			} else if (sizeInKb > 0) {
				fileSizeMessage = TAPi18n.__('FileSize_KB', { fileSize: sizeInKb.toFixed(2) });
			} else {
				fileSizeMessage = TAPi18n.__('FileSize_Bytes', { fileSize: maxFileSize.toFixed(0) });
			}

			message = TAPi18n.__('Importer_Upload_FileSize_Message', { maxFileSize: fileSizeMessage });
		} else {
			message = TAPi18n.__('Importer_Upload_Unlimited_FileSize');
		}

		return message;
	},
});

function showToastrForErrorType(errorType, defaultErrorString) {
	let errorCode;

	if (typeof errorType === 'string') {
		errorCode = errorType;
	} else if (typeof errorType === 'object') {
		if (errorType.error && typeof errorType.error === 'string') {
			errorCode = errorType.error;
		}
	}

	if (errorCode) {
		const errorTranslation = t(errorCode);
		if (errorTranslation !== errorCode) {
			toastr.error(errorTranslation);
			return;
		}
	}

	toastr.error(t(defaultErrorString || 'Failed_To_upload_Import_File'));
}

function showException(error, defaultErrorString) {
	console.error(error);
	if (error && error.xhr && error.xhr.responseJSON) {
		console.log(error.xhr.responseJSON);

		if (error.xhr.responseJSON.errorType) {
			showToastrForErrorType(error.xhr.responseJSON.errorType, defaultErrorString);
			return;
		}
	}

	toastr.error(t(defaultErrorString || 'Failed_To_upload_Import_File'));
}

function getImportFileData(importer, template) {
	APIClient.get(`v1/getImportFileData?importerKey=${ importer.key }`).then((data) => {
		if (!data) {
			console.warn(`The importer ${ importer.key } is not set up correctly, as it did not return any data.`);
			toastr.error(t('Importer_not_setup'));
			template.preparing.set(false);
			return;
		}

		if (data.waiting) {
			setTimeout(() => {
				getImportFileData(importer, template);
			}, 1000);
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
	}).catch((error) => {
		if (error) {
			showException(error, 'Failed_To_Load_Import_Data');
			template.preparing.set(false);
		}
	});
}

Template.adminImportPrepare.events({
	'change .import-file-input'(event, template) {
		const importer = this;
		if (!importer || !importer.key) { return; }

		const e = event.originalEvent || event;
		let { files } = e.target;
		if (!files || (files.length === 0)) {
			files = (e.dataTransfer != null ? e.dataTransfer.files : undefined) || [];
		}

		Array.from(files).forEach((file) => {
			template.preparing.set(true);

			const reader = new FileReader();

			reader.readAsBinaryString(file);
			reader.onloadend = () => {
				APIClient.post('v1/uploadImportFile', {
					binaryContent: reader.result,
					contentType: file.type,
					fileName: file.name,
					importerKey: importer.key,
				}).then(() => {
					getImportFileData(importer, template);
				}).catch((error) => {
					if (error) {
						showException(error);
						template.preparing.set(false);
					}
				});
			};
		});
	},


	'click .download-public-url'(event, template) {
		const importer = this;
		if (!importer || !importer.key) { return; }

		const fileUrl = $('.import-file-url').val();

		template.preparing.set(true);

		APIClient.post('v1/downloadPublicImportFile', {
			fileUrl,
			importerKey: importer.key,
		}).then(() => {
			getImportFileData(importer, template);
		}).catch((error) => {
			if (error) {
				showException(error);
				template.preparing.set(false);
			}
		});
	},


	'click .button.start'(event, template) {
		const btn = this;
		$(btn).prop('disabled', true);
		for (const user of Array.from(template.users.get())) {
			user.do_import = $(`[name='${ user.user_id }']`).is(':checked');
		}

		for (const channel of Array.from(template.channels.get())) {
			channel.do_import = $(`[name='${ channel.channel_id }']`).is(':checked');
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
		Array.from(template.users.get()).filter((user) => user.is_deleted).map((user) => {
			const box = $(`[name=${ user.user_id }]`);
			return box && box.length && box[0].checked && box.click();
		});
	},

	'click .button.uncheck-archived-channels'(event, template) {
		Array.from(template.channels.get()).filter((channel) => channel.is_archived).map((channel) => {
			const box = $(`[name=${ channel.channel_id }]`);
			return box && box.length && box[0].checked && box.click();
		});
	},
});

Template.adminImportPrepare.onCreated(function() {
	const instance = this;
	this.preparing = new ReactiveVar(true);
	this.loaded = new ReactiveVar(false);
	this.users = new ReactiveVar([]);
	this.channels = new ReactiveVar([]);
	this.message_count = new ReactiveVar(0);

	function loadSelection(progress) {
		if (progress != null ? progress.step : undefined) {
			switch (progress.step) {
				// When the import is running, take the user to the progress page
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
			}
			// Otherwise, we might need to do something based upon the current step
			// of the import
			return loadSelection(progress);
		});
	}
	return FlowRouter.go('/admin/import');
});

Template.adminImportPrepare.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
