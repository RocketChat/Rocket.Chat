import type { IMessage, IUpload } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from '@rocket.chat/core-services';

import { FileUpload } from '../../../app/file-upload/server';

export class UploadService extends ServiceClassInternal implements IUploadService {
	protected name = 'upload';

	async uploadFile({ buffer, details, userId }: IUploadFileParams): Promise<IUpload> {
		let uploadedFile: IUpload = {} as IUpload;
		Meteor.runAsUser(userId, () => {
			const fileStore = FileUpload.getStore('Uploads');
			uploadedFile = fileStore.insertSync(details, buffer);
		});
		return uploadedFile;
	}

	async sendFileMessage({ roomId, file, userId, message }: ISendFileMessageParams): Promise<IMessage | undefined> {
		let msg;
		Meteor.runAsUser(userId, () => {
			msg = Meteor.call('sendFileMessage', roomId, null, file, message);
		});
		return msg;
	}

	async sendFileLivechatMessage({ roomId, visitorToken, file, message }: ISendFileLivechatMessageParams): Promise<IMessage> {
		return Meteor.call('sendFileLivechatMessage', roomId, visitorToken, file, message);
	}

	async getBuffer(cb: Function): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			FileUpload.getBuffer(cb, (error: Error, result: Buffer) => {
				if (error) {
					return reject(error);
				}

				resolve(result);
			});
		});
	}
}
