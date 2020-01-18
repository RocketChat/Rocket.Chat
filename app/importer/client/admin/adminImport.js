import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

import { t, APIClient } from '../../../utils';
import { SideNav } from '../../../ui-utils/client';

import './adminImport.html';

Template.adminImport.helpers({
	isPreparing() {
		return Template.instance().preparing.get();
	},
	history() {
		return Template.instance().history.get();
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

Template.adminImport.events({
	'click .new-import-btn'() {
		FlowRouter.go('/admin/import/new');
	},
	'click .prepare-btn'() {
		FlowRouter.go('/admin/import/prepare');
	},
});

Template.adminImport.onCreated(function() {
	const instance = this;
	this.preparing = new ReactiveVar(true);
	this.history = new ReactiveVar([]);

	APIClient.get('v1/getLatestImportOperations').then((data) => {
		instance.history.set(data);
		instance.preparing.set(false);
	}).catch((error) => {
		if (error) {
			toastr.error(t('Failed_To_Load_Import_Data'));
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
