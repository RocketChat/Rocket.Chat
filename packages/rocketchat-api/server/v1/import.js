import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.API.v1.addRoute('uploadImportFile', { authRequired: true }, {
	post() {
		const { binaryContent, contentType, fileName, importerKey } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('uploadImportFile', binaryContent, contentType, fileName, importerKey));
		});

		return RocketChat.API.v1.success();
	},

});

RocketChat.API.v1.addRoute('downloadPublicImportFile', { authRequired: true }, {
	post() {
		const { fileUrl, importerKey } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('downloadPublicImportFile', fileUrl, importerKey));
		});

		return RocketChat.API.v1.success();
	},

});

RocketChat.API.v1.addRoute('getImportFileData', { authRequired: true }, {
	get() {
		const { importerKey } = this.requestParams();
		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getImportFileData', importerKey);
		});

		return RocketChat.API.v1.success(result);
	},

});

RocketChat.API.v1.addRoute('getLatestImportOperations', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('getLatestImportOperations'));

		return RocketChat.API.v1.success(result);
	},
});
