import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

import { t, APIClient } from '../../../utils';
import { SideNav } from '../../../ui-utils/client';
import { ImportWaitingStates, ImportFileReadyStates, ImportPreparingStartedStates, ImportingStartedStates, ProgressStep } from '../../lib/ImporterProgressStep';

import './adminImport.html';
import './importOperationSummary.js';

Template.adminImport.helpers({
	isPreparing() {
		return Template.instance().preparing.get();
	},
	history() {
		return Template.instance().history.get();
	},

	operation() {
		return Template.instance().operation.get();
	},

	isNotCurrentOperation() {
		const operation = Template.instance().operation.get();
		if (!operation) {
			return true;
		}

		return operation._id !== this._id || !operation.valid;
	},

	canShowCurrentOperation() {
		const operation = Template.instance().operation.get();
		return operation && operation.valid;
	},

	canContinueOperation() {
		const operation = Template.instance().operation.get();
		if (!operation || !operation.valid) {
			return false;
		}

		const possibleStatus = [ProgressStep.USER_SELECTION].concat(ImportWaitingStates).concat(ImportFileReadyStates).concat(ImportPreparingStartedStates);
		return possibleStatus.includes(operation.status);
	},

	canCheckOperationProgress() {
		const operation = Template.instance().operation.get();
		if (!operation || !operation.valid) {
			return false;
		}

		return ImportingStartedStates.includes(operation.status);
	},

	anySuccessfulSlackImports() {
		const history = Template.instance().history.get();
		if (!history) {
			return false;
		}

		for (const op of history) {
			if (op.importerKey === 'slack' && op.status === ProgressStep.DONE) {
				return true;
			}
		}

		return false;
	},
});

Template.adminImport.events({
	'click .new-import-btn'() {
		FlowRouter.go('/admin/import/new');
	},
	'click .download-slack-files-btn'(event, template) {
		template.preparing.set(true);
		APIClient.post('v1/downloadPendingFiles').then((data) => {
			template.preparing.set(false);
			if (data.count) {
				toastr.success(t('File_Downloads_Started'));
				FlowRouter.go('/admin/import/progress');
			} else {
				toastr.success(t('No_files_left_to_download'));
			}
		}).catch((error) => {
			template.preparing.set(false);
			if (error) {
				console.error(error);
				toastr.error(t('Failed_To_Download_Files'));
			}
		});
	},
	'click .prepare-btn'() {
		FlowRouter.go('/admin/import/prepare');
	},
	'click .progress-btn'() {
		FlowRouter.go('/admin/import/progress');
	},
});

Template.adminImport.onCreated(function() {
	const instance = this;
	this.preparing = new ReactiveVar(true);
	this.history = new ReactiveVar([]);
	this.operation = new ReactiveVar(false);

	APIClient.get('v1/getCurrentImportOperation').then((data) => {
		instance.operation.set(data.operation);

		APIClient.get('v1/getLatestImportOperations').then((data) => {
			instance.history.set(data);
			instance.preparing.set(false);
		}).catch((error) => {
			if (error) {
				toastr.error(t('Failed_To_Load_Import_History'));
				instance.preparing.set(false);
			}
		});
	}).catch((error) => {
		if (error) {
			toastr.error(t('Failed_To_Load_Import_Operation'));
			instance.preparing.set(false);
		}
	});
});

Template.adminImport.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
