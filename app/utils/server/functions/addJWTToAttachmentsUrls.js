import { FileUpload } from '../../../file-upload/server';

export const addJWTTAttachmentsUrls = (message) => {
	if (message.file && message.attachments && Array.isArray(message.attachments) && message.attachments.length) {
		const jwt = FileUpload.addJWTToFileUrl({ rid: message.rid, userId: message.u._id, fileId: message.file._id });
		message.attachments.forEach((attachment) => {
			if (attachment.title_link) {
				attachment.title_link = `${ attachment.title_link }?token=${ jwt }`;
			}
			if (attachment.image_url) {
				attachment.image_url = `${ attachment.image_url }?token=${ jwt }`;
			}
		});
	}
	return message;
};
