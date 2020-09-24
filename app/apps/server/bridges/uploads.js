import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { determineFileType } from '../../lib/misc/determineFileType';

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

	async createUpload(details = {}, buffer, appId) {
		this.orch.debugLog(`The App ${ appId } is creating an upload "${ details.name }"`);

		if (!details.userId && !details.visitorToken) {
			throw new Error('Missing user to perform the upload operation');
		}

		const fileStore = FileUpload.getStore('Uploads');
		const insertSync = Meteor.wrapAsync(fileStore.insert.bind(fileStore));

		details.type = determineFileType(buffer, details);

		if (details.visitorToken) {
			delete details.userId;
			const uploadedFile = insertSync(details, buffer);

			Meteor.call('sendFileLivechatMessage', details.rid, details.visitorToken, uploadedFile);
			return this.orch.getConverters().get('uploads').convertToApp(uploadedFile);
		}

		return new Promise((resolve, reject) => Meteor.runAsUser(details.userId, () => {
			try {
				const uploadedFile = insertSync(details, buffer);

				Meteor.call('sendFileMessage', details.rid, null, uploadedFile);
				resolve(this.orch.getConverters().get('uploads').convertToApp(uploadedFile));
			} catch (err) {
				reject(err);
			}
		}));
	}
}
