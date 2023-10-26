import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import { UploadBridge } from '@rocket.chat/apps-engine/server/bridges/UploadBridge';

import { determineFileType } from '../../../../ee/lib/misc/determineFileType';
import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { FileUpload } from '../../../file-upload/server';
import { sendFileMessage } from '../../../file-upload/server/methods/sendFileMessage';
import { sendFileLivechatMessage } from '../../../livechat/server/methods/sendFileLivechatMessage';

const getUploadDetails = (details: IUploadDetails): Partial<IUploadDetails> => {
	if (details.visitorToken) {
		const { userId, ...result } = details;
		return result;
	}
	return details;
};
export class AppUploadBridge extends UploadBridge {
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

		const result = await FileUpload.getBuffer(rocketChatUpload);

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

		const fileStore = FileUpload.getStore('Uploads');

		details.type = determineFileType(buffer, details.name);

		const uploadedFile = await fileStore.insert(getUploadDetails(details), buffer);
		this.orch.debugLog(`The App ${appId} has created an upload`, uploadedFile);
		if (details.visitorToken) {
			await sendFileLivechatMessage({ roomId: details.rid, visitorToken: details.visitorToken, file: uploadedFile });
		} else {
			await sendFileMessage(details.userId, { roomId: details.rid, file: uploadedFile });
		}
		return this.orch.getConverters()?.get('uploads').convertToApp(uploadedFile);
	}
}
