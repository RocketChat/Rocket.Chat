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

import { uploadsExamples } from './uploads.examples';
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
		summary: 'Delete Uploaded File',
		description: `Delete a specific file uploaded to a room. The response includes the list of files that were successfully removed. It may include additional files such as image thumbnails. 

Users can delete messages only in the following cases:
 * The **Allow Message Deleting** setting is enabled in the workspace's **<a href='https://docs.rocket.chat/docs/message' target='_blank'>Message</a>** settings.
 * If the \`Block Message Deleting After (n) Minutes\` message setting has a non-zero value, the \`bypass-time-limit-edit-and-delete\` permission is required to delete messages after the defined time limit.
 * In read-only rooms, the \`post-readonly\` permission is required to delete messages.
 * The \`delete-own-message\` permission is required to delete users' own messages.
 * The \`delete-message\` permission is required for users to delete messages from other users.
 
 ### Changelog
 | Version | Description |
 | ------- | ----------- |
 | 8.2.0   | Added       |`,
		examples: uploadsExamples['uploads.delete'],
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

		const user = await Users.findOneById(this.userId);
		// Safeguard, can't really happen
		if (!user) {
			return API.v1.forbidden('forbidden');
		}

		if (!(await Upload.canDeleteFile(user, file, msg))) {
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
