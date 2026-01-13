import { LivechatVisitors, LivechatRooms } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { MultipartUploadHandler } from '../../../../api/server/lib/MultipartUploadHandler';
import { FileUpload } from '../../../../file-upload/server';
import { settings } from '../../../../settings/server';
import { fileUploadIsValidContentType } from '../../../../utils/server/restrictions';
import { sendFileLivechatMessage } from '../../../server/methods/sendFileLivechatMessage';

API.v1.addRoute('livechat/upload/:rid', {
	async post() {
		if (!this.request.headers.get('x-visitor-token')) {
			return API.v1.forbidden();
		}

		const canUpload = settings.get<boolean>('Livechat_fileupload_enabled') && settings.get<boolean>('FileUpload_Enabled');

		if (!canUpload) {
			return API.v1.failure({
				reason: 'error-file-upload-disabled',
			});
		}

		const visitorToken = this.request.headers.get('x-visitor-token');
		const visitor = await LivechatVisitors.getVisitorByToken(visitorToken as string, {});

		if (!visitor) {
			return API.v1.forbidden();
		}

		const room = await LivechatRooms.findOneOpenByRoomIdAndVisitorToken(this.urlParams.rid, visitorToken as string);
		if (!room) {
			return API.v1.forbidden();
		}

		const maxFileSize = settings.get<number>('FileUpload_MaxFileSize') || 104857600;

		const { file, fields } = await MultipartUploadHandler.parseRequest(this.request, {
			field: 'file',
			maxSize: maxFileSize > -1 ? maxFileSize : undefined,
		});

		if (!file) {
			return API.v1.failure({
				reason: 'error-no-file-uploaded',
			});
		}

		if (!fileUploadIsValidContentType(file.mimetype)) {
			return API.v1.failure({
				reason: 'error-type-not-allowed',
			});
		}

		const fileStore = FileUpload.getStore('Uploads');

		const details = {
			name: file.filename,
			size: file.size,
			type: file.mimetype,
			rid: this.urlParams.rid,
			visitorToken,
		};

		const uploadedFile = await fileStore.insert(details, file.tempFilePath);
		if (!uploadedFile) {
			return API.v1.failure('Invalid file');
		}

		uploadedFile.description = fields.description;

		delete fields.description;
		return API.v1.success(await sendFileLivechatMessage({ roomId: this.urlParams.rid, visitorToken, file: uploadedFile, msgData: fields }));
	},
});
