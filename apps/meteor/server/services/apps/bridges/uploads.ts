import { UploadBridge } from '@rocket.chat/apps-engine/server/bridges/UploadBridge';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads';

import { Upload } from '../../../sdk';
import { FileUpload } from '../../../../app/file-upload/server';
import { determineFileType } from '../../../../app/apps/lib/misc/determineFileType';
import type { AppServerOrchestrator } from '../orchestrator';

const getUploadDetails = (details: IUploadDetails): Partial<IUploadDetails> => {
	if (details.visitorToken) {
		const { userId, ...result } = details;
		return result;
	}
	return details;
};
export class AppUploadBridge extends UploadBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getById(id: string, appId: string): Promise<IUpload> {
		this.orch.debugLog(`The App ${appId} is getting the upload: "${id}"`);

		return this.orch.getConverters()?.get('uploads').convertById(id);
	}

	protected async getBuffer(upload: IUpload, appId: string): Promise<Buffer> {
		this.orch.debugLog(`The App ${appId} is getting the upload: "${upload.id}"`);

		const rocketChatUpload = this.orch.getConverters()?.get('uploads').convertToRocketChat(upload);

		return new Promise((resolve, reject) => {
			FileUpload.getBuffer(rocketChatUpload, (error: Error, result: Buffer) => {
				if (error) {
					return reject(error);
				}

				resolve(result);
			});
		});
	}

	protected async createUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload> {
		this.orch.debugLog(`The App ${appId} is creating an upload "${details.name}"`);

		if (!details.userId && !details.visitorToken) {
			throw new Error('Missing user to perform the upload operation');
		}

		details.type = determineFileType(buffer, details.name);

		const uploadDetails = getUploadDetails(details);
		const uploadedFile = await Upload.uploadFile({ buffer, details: uploadDetails, userId: details.userId });

		if (details.visitorToken) {
			await Upload.sendFileLivechatMessage({
				file: uploadedFile,
				roomId: details.rid,
				visitorToken: details.visitorToken,
			});
		} else {
			await Upload.sendFileMessage({
				roomId: details.rid,
				file: uploadedFile,
				userId: details.userId,
			});
		}

		this.orch.debugLog(`The App ${appId} has created an upload`, uploadedFile);

		return this.orch.getConverters()?.get('uploads').convertToApp(uploadedFile);
	}
}
