import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { determineFileType } from '../../lib/misc/determineFileType';
import { Users } from '../../../models';

export class AppUploadBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async getById(id, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the upload: "${ id }"`);

		return this.orch.getConverters().get('uploads').convertById(id);
	}

	getBuffer(upload, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the upload: "${ upload.id }"`);

		const rocketChatUpload = this.orch.getConverters().get('uploads').convertToRocketChat(upload);

		return new Promise((resolve, reject) => {
			FileUpload.getBuffer(rocketChatUpload, (error, result) => {
				if (error) {
					return reject(error);
				}

				resolve(result);
			});
		});
	}

	async createUpload(details, buffer, appId) {
		this.orch.debugLog(`The App ${ appId } is creating an upload "${ details.name }"`);

		if (!details.userId && !details.visitorToken) {
			throw new Error('Missing user to perform the upload operation');
		}

		if (details.visitorToken) {
			delete details.userId;
		}

		const appUser = Users.findOneByAppId(appId);
		if (!appUser) {
			throw new Error('Invalid app Id');
		}

		const fileStore = FileUpload.getStore('Uploads');
		const insertSync = details.userId
			? (...args) => Meteor.runAsUser(details.userId, () => fileStore.insertSync(...args))
			: (...args) => Meteor.runAsUser(appUser._id, () => fileStore.insertSync(...args));

		details.type = determineFileType(buffer, details);

		return new Promise(Meteor.bindEnvironment((resolve, reject) => {
			try {
				const uploadedFile = insertSync(details, buffer);

				if (details.visitorToken) {
					Meteor.call('sendFileLivechatMessage', details.rid, details.visitorToken, uploadedFile);
				} else {
					Meteor.runAsUser(details.userId, () => {
						Meteor.call('sendFileMessage', details.rid, null, uploadedFile);
					});
				}

				resolve(this.orch.getConverters().get('uploads').convertToApp(uploadedFile));
			} catch (err) {
				reject(err);
			}
		}));
	}
}
