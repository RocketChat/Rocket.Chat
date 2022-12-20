import type { IMessage, IUpload } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type {
	ISendFileLivechatMessageParams,
	ISendFileMessageParams,
	IUploadFileParams,
	IUploadService,
} from '../../sdk/types/IUploadService';
import { FileUpload } from '../../../app/file-upload/server';

export class UploadService extends ServiceClassInternal implements IUploadService {
	protected name = 'upload';

	async uploadFile({ buffer, details, userId }: IUploadFileParams): Promise<IUpload> {
		return Meteor.runAsUser(userId, () => {
			const fileStore = FileUpload.getStore('Uploads');
			return fileStore.insert(details, buffer);
		});
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
