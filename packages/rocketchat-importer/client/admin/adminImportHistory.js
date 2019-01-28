import { Meteor } from 'meteor/meteor';
import { Importers } from 'meteor/rocketchat:importer';
import { Template } from 'meteor/templating';
import { hasRole } from 'meteor/rocketchat:authorization';
import { t } from 'meteor/rocketchat:utils';
import toastr from 'toastr';
import { ReactiveVar } from 'meteor/reactive-var';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { API } from 'meteor/rocketchat:api';

Template.adminImportHistory.helpers({
	isAdmin() {
		return hasRole(Meteor.userId(), 'admin');
	},
	importers() {
		return Importers.getAll();
	},
	isPreparing() {
		return Template.instance().preparing.get();
	},
	history() {
		return Template.instance().history.get();
	},
	statusMessage() {
		const statusKey = this.status || ProgressStep.NEW;

		switch (statusKey) {
			case ProgressStep.NEW:
				return t('Not_started');
			case ProgressStep.UPLOADING:
				return t('Uploading_file');
			case ProgressStep.DOWNLOADING_FILE_URL:
				return t('Downloading_file_from_external_URL');
			case ProgressStep.DOWNLOAD_COMPLETE:
				return t('Successfully_downloaded_file_from_external_URL_should_start_preparing_soon');
			case ProgressStep.PREPARING_STARTED:
				return t('Preparing_data_for_import_process');
			case ProgressStep.PREPARING_USERS:
				return t('Preparing_list_of_users');
			case ProgressStep.PREPARING_CHANNELS:
				return t('Preparing_list_of_channels');
			case ProgressStep.PREPARING_MESSAGES:
				return t('Preparing_list_of_messages');
			case ProgressStep.USER_SELECTION:
				return t('Selecting_users');
			case ProgressStep.IMPORTING_STARTED:
				return t('Started');
			case ProgressStep.IMPORTING_USERS:
				return t('Importing_users');
			case ProgressStep.IMPORTING_CHANNELS:
				return t('Importing_channels');
			case ProgressStep.IMPORTING_MESSAGES:
				return t('Importing_messages');
			case ProgressStep.FINISHING:
				return t('Almost_done');
			case ProgressStep.DONE:
				return t('Completed');
			case ProgressStep.ERROR:
				return t('Error');
			case ProgressStep.CANCELLED:
				return t('Canceled');
			default:
				return statusKey;
		}
	},

	lastUpdated() {
		if (!this._updatedAt) {
			return '';
		}

		const date = new Date(this._updatedAt);
		return date.toLocaleString();
	},

	hasCounters() {
		return Boolean(this.count);
	},

	userCount() {
		if (this.count && this.count.users) {
			return this.count.users;
		}

		return 0;
	},

	channelCount() {
		if (this.count && this.count.channels) {
			return this.count.channels;
		}

		return 0;
	},

	messageCount() {
		if (this.count && this.count.messages) {
			return this.count.messages;
		}

		return 0;
	},

	totalCount() {
		if (this.count && this.count.total) {
			return this.count.total;
		}

		return 0;
	},

	hasErrors() {
		if (!this.fileData) {
			return false;
		}

		if (this.fileData.users) {
			for (const user of this.fileData.users) {
				if (user.is_email_taken) {
					return true;
				}
				if (user.error) {
					return true;
				}
			}
		}

		if (this.errors && this.errors.length > 0) {
			return true;
		}

		return false;
	},

	formatedError() {
		if (!this.error) {
			return '';
		}

		if (typeof this.error === 'string') {
			return this.error;
		}

		if (typeof this.error === 'object') {
			if (this.error.message) {
				return this.error.message;
			}
			if (this.error.error && typeof this.error.error === 'string') {
				return this.error.error;
			}

			try {
				const json = JSON.stringify(this.error);
				console.log(json);
				return json;
			} catch (e) {
				return t('Error');
			}
		}

		return this.error.toString();
	},

	messageTime() {
		if (!this.msg || !this.msg.ts) {
			return '';
		}

		const date = new Date(this.msg.ts);
		return date.toLocaleString();
	},
});

Template.adminImportHistory.events({
	'click .import-list'() {
		FlowRouter.go('/admin/import');
	},
});


Template.adminImportHistory.onCreated(function() {
	const instance = this;
	this.preparing = new ReactiveVar(true);
	this.history = new ReactiveVar([]);

	API.get('v1/getLatestImportOperations').then((data) => {
		instance.history.set(data);
		instance.preparing.set(false);
	}).catch((error) => {
		if (error) {
			toastr.error(t('Failed_To_Load_Import_Data'));
			instance.preparing.set(false);
		}
	});
});
