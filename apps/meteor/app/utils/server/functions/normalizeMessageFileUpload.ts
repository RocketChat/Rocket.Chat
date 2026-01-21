import type { IMessage } from '@rocket.chat/core-typings';
import { Uploads } from '@rocket.chat/models';

import { FileUpload } from '../../../file-upload/server';
import { getURL } from '../getURL';

const generateFileUploadData = async (
	message: Pick<IMessage, 'rid' | 'u'>,
	fileId: string,
): Promise<{ publicFilePath: string; type?: string; size?: number } | null> => {
	const jwt = FileUpload.generateJWTToFileUrls({
		rid: message.rid,
		userId: message.u._id,
		fileId,
	});
	const file = await Uploads.findOne({ _id: fileId });
	if (!file) {
		return null;
	}
	return {
		publicFilePath: file.name
			? getURL(`${FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`).substring(1)}${jwt ? `?token=${jwt}` : ''}`, {
					cdn: false,
					full: true,
				})
			: '',
		type: file.type,
		size: file.size,
	};
};

export const normalizeMessageFileUpload = async (message: Omit<IMessage, '_updatedAt'>): Promise<Omit<IMessage, '_updatedAt'>> => {
	if (message.file && !message.fileUpload) {
		const fileUploadData = await generateFileUploadData(message, message.file._id);
		if (fileUploadData) {
			message.fileUpload = fileUploadData;
		}
	}

	return message;
};
