import type { IMessage } from '@rocket.chat/core-typings';
import { Uploads } from '@rocket.chat/models';

import { FileUpload } from '../../../file-upload/server';
import { getURL } from '../getURL';

export const normalizeMessageFileUpload = async (message: Omit<IMessage, '_updatedAt'>): Promise<Omit<IMessage, '_updatedAt'>> => {
	if (message.file && !message.fileUpload) {
		const jwt = FileUpload.generateJWTToFileUrls({
			rid: message.rid,
			userId: message.u._id,
			fileId: message.file._id,
		});
		const file = await Uploads.findOne({ _id: message.file._id });
		if (!file) {
			return message;
		}
		message.fileUpload = {
			publicFilePath: file.name
				? getURL(`${FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`).substring(1)}${jwt ? `?token=${jwt}` : ''}`, {
						cdn: false,
						full: true,
				  })
				: '',
			type: file.type,
			size: file.size,
		};
	}
	return message;
};
