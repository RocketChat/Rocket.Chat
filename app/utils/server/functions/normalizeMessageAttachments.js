import { FileUpload } from '../../../file-upload/server';

export const normalizeMessageAttachments = (message) => {
	if (message.file && message.attachments && Array.isArray(message.attachments) && message.attachments.length) {
		const jwt = FileUpload.generateJWTToFileUrls({ rid: message.rid, userId: message.u._id, fileId: message.file._id });
		if (jwt) {
			message.attachments.forEach((attachment) => {
				if (attachment.title_link) {
					attachment.title_link = `${ attachment.title_link }?token=${ jwt }`;
				}
				if (attachment.image_url) {
					attachment.image_url = `${ attachment.image_url }?token=${ jwt }`;
				}
			});
		}
	}
	return message;
};
