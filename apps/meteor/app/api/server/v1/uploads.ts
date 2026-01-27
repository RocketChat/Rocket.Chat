import { Upload } from '@rocket.chat/core-services';
import type { IUpload } from '@rocket.chat/core-typings';
import { Messages, Uploads, Users } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
} from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

type UploadsDeleteResult = {
	/**
	 * The list of files that were successfully removed; May include additional files such as image thumbnails
	 * */
	deletedFiles: IUpload['_id'][];
};

type UploadsDeleteParams = {
	fileId: string;
};

const uploadsDeleteParamsSchema = {
	type: 'object',
	properties: {
		fileId: {
			type: 'string',
		},
	},
	required: ['fileId'],
	additionalProperties: false,
};

export const isUploadsDeleteParams = ajv.compile<UploadsDeleteParams>(uploadsDeleteParamsSchema);

const uploadsDeleteEndpoint = API.v1.post(
	'uploads.delete',
	{
		authRequired: true,
		body: isUploadsDeleteParams,
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
			200: ajv.compile<UploadsDeleteResult>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
					},
					deletedFiles: {
						description: 'The list of files that were successfully removed. May include additional files such as image thumbnails',
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
				required: ['deletedFiles'],
				additionalProperties: false,
			}),
		},
	},
	async function action() {
		const { fileId } = this.bodyParams;

		const file = await Uploads.findOneById(fileId);
		if (!file?.userId || !file.rid) {
			return API.v1.notFound();
		}

		const msg = await Messages.getMessageByFileId(fileId);
		if (!(await Upload.canDeleteFile(this.userId, file, msg))) {
			return API.v1.forbidden('forbidden');
		}

		const user = await Users.findOneById(this.userId);
		// Safeguard, can't really happen
		if (!user) {
			return API.v1.forbidden('forbidden');
		}

		const { deletedFiles } = await Upload.deleteFile(user, fileId, msg);
		return API.v1.success({
			deletedFiles,
		});
	},
);

type UploadsEndpoints = ExtractRoutesFromAPI<typeof uploadsDeleteEndpoint>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends UploadsEndpoints {}
}
