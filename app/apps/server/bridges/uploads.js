import { FileUpload } from '../../../file-upload/server';

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

		return new Promise((resolve, reject) => {
			FileUpload.getBuffer(upload, (error, result) => {
				if (error) {
					return reject(error);
				}

				resolve(result);
			});
		});
	}
}
