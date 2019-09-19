import { FileUpload } from '../../../file-upload/server';
import { Uploads } from '../../../models/server';
import { settings } from '../../../settings/server';

export const normalizeMessageFileUpload = (message) => {
	if (message.file && !message.fileUpload) {
		const jwt = FileUpload.generateJWTToFileUrls({ rid: message.rid, userId: message.u._id, fileId: message.file._id });
		const file = Uploads.findOne({ _id: message.file._id });
		message.fileUpload = {
			publicFilePath: `${ settings.get('Site_Url') }${ FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`).substring(1) }?token=${ jwt }`,
			type: file.type,
			size: file.size,
		};
	}
	return message;
};
