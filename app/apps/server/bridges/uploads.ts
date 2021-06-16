import { Meteor } from 'meteor/meteor';
import { UploadBridge } from '@rocket.chat/apps-engine/server/bridges/UploadBridge';
import { IUpload } from '@rocket.chat/apps-engine/definition/uploads';
import { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';

import { FileUpload } from '../../../file-upload/server';
import { determineFileType } from '../../lib/misc/determineFileType';
import { AppServerOrchestrator } from '../orchestrator';

export class AppUploadBridge extends UploadBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getById(id: string, appId: string): Promise<IUpload> {
		this.orch.debugLog(`The App ${ appId } is getting the upload: "${ id }"`);

		return this.orch.getConverters()?.get('uploads').convertById(id);
	}

	protected async getBuffer(upload: IUpload, appId: string): Promise<Buffer> {
		this.orch.debugLog(`The App ${ appId } is getting the upload: "${ upload.id }"`);

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
		this.orch.debugLog(`The App ${ appId } is creating an upload "${ details.name }"`);

		if (!details.userId && !details.visitorToken) {
			throw new Error('Missing user to perform the upload operation');
		}

		if (details.visitorToken) {
			delete details.userId;
		}

		const fileStore = FileUpload.getStore('Uploads');
		const insertSync = details.userId
			? (...args: any[]): Function => Meteor.runAsUser(details.userId, () => fileStore.insertSync(...args))
			: Meteor.wrapAsync(fileStore.insert.bind(fileStore));

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

				resolve(this.orch.getConverters()?.get('uploads').convertToApp(uploadedFile));
			} catch (err) {
				reject(err);
			}
		}));
	}
}
