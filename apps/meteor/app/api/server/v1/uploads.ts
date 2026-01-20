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

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { canDeleteMessageAsync } from '../../../authorization/server/functions/canDeleteMessage';
import { FileUpload } from '../../../file-upload/server';
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

		if (!(await canAccessRoomIdAsync(file.rid, this.userId))) {
			return API.v1.forbidden('forbidden');
		}

		const msg = await Messages.getMessageByFileId(fileId);

		const isOwnTemporaryFile = !msg && file.expiresAt && file.userId === this.userId;

		if (!isOwnTemporaryFile) {
			// Use the message deletion permissions to determine if the user can delete confirmed files;
			// If there's no message yet, use the data from the file to run the message permission checks
			const msgForValidation = msg || { u: { _id: file.userId }, ts: file.uploadedAt, rid: file.rid };
			if (!(await canDeleteMessageAsync(this.userId, msgForValidation))) {
				return API.v1.forbidden('forbidden');
			}
		}

		const store = FileUpload.getStore('Uploads');

		// Find every file that is derived from the file that is being deleted (its thumbnails)
		const additionalFiles = await Uploads.findAllByOriginalFileId(fileId, { projection: { _id: 1 } })
			.map(({ _id }) => _id)
			.toArray();
		const allFiles = [fileId, ...additionalFiles];

		if (msg) {
			const user = await Users.findOneById(this.userId);
			if (!user) {
				return API.v1.notFound();
			}
			await Upload.updateMessageRemovingFiles(msg, allFiles, user);
		}

		// Delete the main file first;
		await store.deleteById(fileId);

		// The main file is already deleted; From here forward we'll return a success response even if some sub-process fails

		const deletedFiles: IUpload['_id'][] = [fileId];
		// Delete them one by one as the store may include requests to external services
		for await (const id of additionalFiles) {
			try {
				await store.deleteById(id);
				deletedFiles.push(id);
			} catch (err) {
				this.logger.error({ msg: 'Failed to delete derived file', fileId: id, originalFileId: fileId, err });
			}
		}

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
