import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

import { t, APIClient } from '../../../utils';
import { SideNav } from '../../../ui-utils/client';
import { ProgressStep, ImportWaitingStates, ImportFileReadyStates, ImportPreparingStartedStates, ImportingStartedStates, ImportingErrorStates } from '../../lib/ImporterProgressStep';
import { showImporterException } from '../functions/showImporterException';

import { ImporterWebsocketReceiver } from '..';

import './adminImportPrepare.html';

Template.adminImportPrepare.helpers({
	isPreparing() {
		return Template.instance().preparing.get();
	},
	hasProgressRate() {
		return Template.instance().progressRate.get() !== false;
	},
	progressRate() {
		const rate = Template.instance().progressRate.get();
		if (rate) {
			return `${ rate }%`;
		}

		return '';
	},
	pageTitle() {
		return t('Importing_Data');
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
});

Template.adminImportPrepare.events({
	'click .button.start'(event, template) {
		const btn = this;
		$(btn).prop('disabled', true);
		for (const user of Array.from(template.users.get())) {
			user.do_import = $(`[name='${ user.user_id }']`).is(':checked');
		}

		for (const channel of Array.from(template.channels.get())) {
			channel.do_import = $(`[name='${ channel.channel_id }']`).is(':checked');
		}

		APIClient.post('v1/startImport', { input: { users: template.users.get(), channels: template.channels.get() } }).then(() => {
			template.users.set([]);
			template.channels.set([]);
			return FlowRouter.go('/admin/import/progress');
		}).catch((error) => {
			if (error) {
				showImporterException(error, 'Failed_To_Start_Import');
				return FlowRouter.go('/admin/import');
			}
		});
	},

	'click .button.uncheck-deleted-users'(event, template) {
		Array.from(template.users.get()).filter((user) => user.is_deleted).map((user) => {
			const box = $(`[name=${ user.user_id }]`);
			return box && box.length && box[0].checked && box.click();
		});
	},

	'click .button.check-all-users'(event, template) {
		Array.from(template.users.get()).forEach((user) => {
			const box = $(`[name=${ user.user_id }]`);
			return box && box.length && !box[0].checked && box.click();
		});
	},

	'click .button.uncheck-all-users'(event, template) {
		Array.from(template.users.get()).forEach((user) => {
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

	'click .button.check-all-channels'(event, template) {
		Array.from(template.channels.get()).forEach((channel) => {
			const box = $(`[name=${ channel.channel_id }]`);
			return box && box.length && !box[0].checked && box.click();
		});
	},

	'click .button.uncheck-all-channels'(event, template) {
		Array.from(template.channels.get()).forEach((channel) => {
			const box = $(`[name=${ channel.channel_id }]`);
			return box && box.length && box[0].checked && box.click();
		});
	},

});

function getImportFileData(template) {
	APIClient.get('v1/getImportFileData').then((data) => {
		if (!data) {
			console.warn('The importer is not set up correctly, as it did not return any data.');
			toastr.error(t('Importer_not_setup'));
			return FlowRouter.go('/admin/import');
		}

		if (data.waiting) {
			setTimeout(() => {
				getImportFileData(template);
			}, 1000);
			return;
		}

		if (data.step) {
			console.warn('Invalid file, contains `data.step`.', data);
			toastr.error(t('Failed_To_Load_Import_Data'));
			return FlowRouter.go('/admin/import');
		}

		template.users.set(data.users);
		template.channels.set(data.channels);
		template.message_count.set(data.message_count);
		template.preparing.set(false);
		template.progressRate.set(false);
	}).catch((error) => {
		if (error) {
			showImporterException(error, 'Failed_To_Load_Import_Data');
			return FlowRouter.go('/admin/import');
		}
	});
}

function loadOperation(template) {
	APIClient.get('v1/getCurrentImportOperation').then((data) => {
		const { operation } = data;

		if (!operation.valid) {
			return FlowRouter.go('/admin/import/new');
		}

		// If the import has already started, move to the progress screen
		if (ImportingStartedStates.includes(operation.status)) {
			return FlowRouter.go('/admin/import/progress');
		}

		// The getImportFileData method can handle it if the state is:
		// 1) ready to select the users,
		// 2) preparing
		// 3) ready to be prepared

		if (operation.status === ProgressStep.USER_SELECTION || ImportPreparingStartedStates.includes(operation.status) || ImportFileReadyStates.includes(operation.status)) {
			if (!template.callbackRegistered) {
				ImporterWebsocketReceiver.registerCallback(template.progressUpdated);
				template.callbackRegistered = true;
			}

			getImportFileData(template);
			return template.preparing.set(true);
		}

		// We're still waiting for a file... This shouldn't take long
		if (ImportWaitingStates.includes(operation.status)) {
			setTimeout(() => {
				loadOperation(template);
			}, 1000);

			return template.preparing.set(true);
		}

		if (ImportingErrorStates.includes(operation.status)) {
			toastr.error(t('Import_Operation_Failed'));
			return FlowRouter.go('/admin/import');
		}

		if (operation.status === ProgressStep.DONE) {
			return FlowRouter.go('/admin/import');
		}

		toastr.error(t('Unknown_Import_State'));
		return FlowRouter.go('/admin/import');
	}).catch((error) => {
		if (error) {
			toastr.error(t('Failed_To_Load_Import_Data'));
			return FlowRouter.go('/admin/import');
		}
	});
}

Template.adminImportPrepare.onCreated(function() {
	this.preparing = new ReactiveVar(true);
	this.progressRate = new ReactiveVar(false);
	this.callbackRegistered = false;
	this.users = new ReactiveVar([]);
	this.channels = new ReactiveVar([]);
	this.message_count = new ReactiveVar(0);

	this.progressUpdated = (progress) => {
		if ('rate' in progress) {
			const { rate } = progress;
			this.progressRate.set(rate);
		}
	};

	loadOperation(this);
});

Template.adminImportPrepare.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.adminImportPrepare.onDestroyed(function() {
	this.callbackRegistered = false;
	ImporterWebsocketReceiver.unregisterCallback(this.progressUpdated);
});
