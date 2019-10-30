import { getURL } from '../../lib/getURL';
import { FileUpload } from '../../../file-upload/server';
import { Uploads } from '../../../models/server';

function userId(message) {
	return message.u ? message.u._id : message.agentId;
}

export const normalizeMessageFileUpload = (message) => {
	if (message.file && !message.fileUpload) {
		const jwt = FileUpload.generateJWTToFileUrls({ rid: message.rid, userId: userId(message), fileId: message.file._id });
		const file = Uploads.findOne({ _id: message.file._id });
		if (!file) {
			return message;
		}
		message.fileUpload = {
			publicFilePath: getURL(`${ FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`).substring(1) }${ jwt ? `?token=${ jwt }` : '' }`, { cdn: false, full: true }),
			type: file.type,
			size: file.size,
		};
	}
	return message;
};
