import { ServiceClassInternal } from '@rocket.chat/core-services';
import { Meteor } from 'meteor/meteor';
import type { IMessage, IUpload } from '@rocket.chat/core-typings';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from '@rocket.chat/core-services';

import { FileUpload } from '../../../app/file-upload/server';

export class UploadService extends ServiceClassInternal implements IUploadService {
	protected name = 'upload';

	async uploadFile({ buffer, details }: IUploadFileParams): Promise<IUpload> {
		const fileStore = FileUpload.getStore('Uploads');
		return fileStore.insert(details, buffer);
	}

	async sendFileMessage({ roomId, file, userId, message }: ISendFileMessageParams): Promise<IMessage | undefined> {
		return Meteor.runAsUser(userId, () => Meteor.call('sendFileMessage', roomId, null, file, message));
	}

	async sendFileLivechatMessage({ roomId, visitorToken, file, message }: ISendFileLivechatMessageParams): Promise<IMessage> {
		return Meteor.call('sendFileLivechatMessage', roomId, visitorToken, file, message);
	}

	async getFileBuffer({ file }: { userId: string; file: IUpload }): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			FileUpload.getBuffer(file, (err: Error, buffer: Buffer) => {
				if (err) {
					return reject(err);
				}
				return resolve(buffer);
			});
		});
	}
}
