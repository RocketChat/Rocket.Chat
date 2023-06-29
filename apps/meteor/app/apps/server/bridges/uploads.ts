import { UploadBridge } from '@rocket.chat/apps-engine/server/bridges/UploadBridge';
import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import { Upload } from '@rocket.chat/core-services';

import { determineFileType } from '../../../../ee/lib/misc/determineFileType';
import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';

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

		const result = await Upload.getFileBuffer(rocketChatUpload);

		if (!(result instanceof Buffer)) {
			throw new Error('Unknown error');
		}

		return result;
	}

	protected async createUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload> {
		this.orch.debugLog(`The App ${appId} is creating an upload "${details.name}"`);

		if (!details.userId && !details.visitorToken) {
			throw new Error('Missing user to perform the upload operation');
		}

		details.type = determineFileType(buffer, details.name);

		const uploadedFile = await Upload.uploadFile({ buffer, details: getUploadDetails(details), userId: details.userId });
		this.orch.debugLog(`The App ${appId} has created an upload`, uploadedFile);
		if (details.visitorToken) {
			await Upload.sendFileLivechatMessage({
				roomId: details.rid,
				visitorToken: details.visitorToken,
				file: uploadedFile,
			});
		} else {
			await Upload.sendFileMessage({
				userId: details.userId,
				roomId: details.rid,
				file: uploadedFile,
			});
		}
		return this.orch.getConverters()?.get('uploads').convertToApp(uploadedFile);
	}
}
