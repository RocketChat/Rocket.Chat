import type { IMessage } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatVisitors } from '@rocket.chat/models';
import { ajv, validateForbiddenErrorResponse } from '@rocket.chat/rest-typings';

import { FileUpload } from '../../../lib/media/file-upload';
import { fileUploadIsValidContentType } from '../../../lib/utils/restrictions';
import { sendFileLivechatMessage } from '../../../meteor-methods/omnichannel/sendFileLivechatMessage';
import { settings } from '../../../settings';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { API } from '../../api';
import { MultipartUploadHandler } from '../../lib/MultipartUploadHandler';

const uploadResponseSchema = ajv.compile<IMessage & { newRoom: boolean; showConnecting: boolean; success: true }>({
	type: 'object',
	allOf: [
		{ $ref: '#/components/schemas/IMessage' },
		{
			type: 'object',
			properties: {
				newRoom: { type: 'boolean' },
				showConnecting: { type: 'boolean' },
				success: { type: 'boolean', enum: [true] },
			},
			required: ['newRoom', 'showConnecting', 'success'],
		},
	],
	unevaluatedProperties: false,
});

const uploadBadRequestResponseSchema = ajv.compile<{
	success: false;
	reason?: string;
	error?: string;
	errorType?: string;
	stack?: string;
	details?: string | object | object[];
}>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		reason: { type: 'string' },
		stack: { type: 'string' },
		error: { type: 'string' },
		errorType: { type: 'string' },
		details: { anyOf: [{ type: 'string' }, { type: 'object' }, { type: 'array' }] },
	},
	required: ['success'],
	additionalProperties: false,
});

const livechatUploadEndpoints = API.v1.post(
	'livechat/upload/:rid',
	{
		authRequired: false,
		rateLimiterOptions: {
			numRequestsAllowed: 5,
			intervalTimeInMS: 10000,
		},
		response: {
			200: uploadResponseSchema,
			400: uploadBadRequestResponseSchema,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const visitorToken = this.request.headers.get('x-visitor-token');
		if (!visitorToken) {
			return API.v1.forbidden();
		}

		const canUpload = settings.get<boolean>('Livechat_fileupload_enabled') && settings.get<boolean>('FileUpload_Enabled');

		if (!canUpload) {
			return API.v1.failure({
				reason: 'error-file-upload-disabled',
			});
		}

		const visitor = await LivechatVisitors.getVisitorByToken(visitorToken, {});

		if (!visitor) {
			return API.v1.forbidden();
		}

		const room = await LivechatRooms.findOneOpenByRoomIdAndVisitorToken(this.urlParams.rid, visitorToken);
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
		const uploaded = await sendFileLivechatMessage({
			roomId: this.urlParams.rid,
			visitorToken,
			file: uploadedFile,
			msgData: fields,
		});

		if (!uploaded) {
			await fileStore.deleteById(uploadedFile._id);
			return API.v1.failure();
		}

		return API.v1.success(uploaded as unknown as IMessage & { newRoom: boolean; showConnecting: boolean; success: true });
	},
);

type LivechatUploadEndpoints = ExtractRoutesFromAPI<typeof livechatUploadEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatUploadEndpoints {}
}
