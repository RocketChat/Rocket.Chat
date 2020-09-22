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

	createUpload(details, buffer, appId) {
		this.orch.debugLog(`The App ${ appId } is creating an upload "${ details.name }"`);

		details.type = determineFileType(buffer, details);

		const fileStore = FileUpload.getStore('Uploads');
		const uploadedFile = fileStore.insertSync(details, buffer);

		return this.orch.getConverters().get('uploads').convertToApp(uploadedFile);
	}
}
