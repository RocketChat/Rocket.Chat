import { Template } from 'meteor/templating';

import { t } from '../../../utils';

import './importOperationSummary.html';

Template.importOperationSummary.helpers({
	lastUpdated() {
		if (!this._updatedAt) {
			return '';
		}

		const date = new Date(this._updatedAt);
		return date.toLocaleString();
	},

	status() {
		if (!this.status) {
			return '';
		}

		return t(this.status.replace('importer_', 'importer_status_'));
	},

	fileName() {
		const fileName = this.file;
		if (!fileName) {
			return '';
		}

		// If the userid is inside the filename, remove it and anything before it
		const idx = fileName.indexOf(`_${ this.user }_`);
		if (idx >= 0) {
			return fileName.substring(idx + this.user.length + 2);
		}

		return fileName;
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
