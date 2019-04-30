import { Meteor } from 'meteor/meteor';
import { API } from '../api';

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

API.v1.addRoute('getImportFileData', { authRequired: true }, {
	get() {
		const { importerKey } = this.requestParams();
		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getImportFileData', importerKey);
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
