import { getURL } from '../../lib/getURL';
import { FileUpload } from '../../../file-upload/server';
import { Uploads } from '../../../models/server/raw';

export const normalizeMessageFileUpload = async (message) => {
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
			publicFilePath: getURL(`${FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`).substring(1)}${jwt ? `?token=${jwt}` : ''}`, {
				cdn: false,
				full: true,
			}),
			type: file.type,
			size: file.size,
		};
	}
	return message;
};
