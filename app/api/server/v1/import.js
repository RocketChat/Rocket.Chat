import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { hasPermission } from '../../../authorization/server';
import { Imports } from '../../../models/server';
import { imageDownloader } from '../../../importer-slack/server/imageDownloader';

API.v1.addRoute('uploadImportFile', { authRequired: true }, {
	post() {
		const { binaryContent, contentType, fileName, importerKey } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('uploadImportFile', binaryContent, contentType, fileName, importerKey));
		});

		return API.v1.success();
	},

});

API.v1.addRoute('downloadPublicImportFile', { authRequired: true }, {
	post() {
		const { fileUrl, importerKey } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('downloadPublicImportFile', fileUrl, importerKey));
		});

		return API.v1.success();
	},

});

API.v1.addRoute('startImport', { authRequired: true }, {
	post() {
		const { importerKey, input } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('startImport', importerKey, input));
		});

		return API.v1.success();
	},
});

API.v1.addRoute('getImportFileData', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getImportFileData');
		});

		return API.v1.success(result);
	},
});

API.v1.addRoute('getImportProgress', { authRequired: true }, {
	get() {
		const { importerKey } = this.queryParams;

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getImportProgress', importerKey);
		});

		return API.v1.success(result);
	},
});

API.v1.addRoute('getLatestImportOperations', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('getLatestImportOperations'); });

		return API.v1.success(result);
	},
});

API.v1.addRoute('downloadSlackImages', { authRequired: true }, {
	post() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'downloadSlackImages' });
		}

		if (!hasPermission(this.userId, 'run-import')) {
			throw new Meteor.Error('not_authorized');
		}

		imageDownloader();
		return API.v1.success();
	},
});

API.v1.addRoute('getCurrentImportOperation', { authRequired: true }, {
	get() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getCurrentImportOperation' });
		}

		if (!hasPermission(this.userId, 'run-import')) {
			throw new Meteor.Error('not_authorized');
		}

		const latest = Imports.findLastImport();
		if (!latest) {
			return API.v1.success({
				success: true,
				operation: null,
			});
		}

		return API.v1.success({
			success: true,
			operation: latest,
		});
	},
});
