import type { ICustomSound } from '@rocket.chat/core-typings';
import { CustomSounds } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import {
	isCustomSoundsGetOneProps,
	isCustomSoundsListProps,
	isCustomSoundsCreateProps,
	isCustomSoundsDeleteProps,
	isCustomSoundsUpdateProps,
	ajv,
	validateBadRequestErrorResponse,
	validateNotFoundErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
	validateInternalErrorResponse,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { MAX_CUSTOM_SOUND_SIZE_BYTES, CUSTOM_SOUND_ALLOWED_MIME_TYPES } from '../../../../lib/constants';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { deleteCustomSound } from '../../../custom-sounds/server/lib/deleteCustomSound';
import { insertOrUpdateSound } from '../../../custom-sounds/server/lib/insertOrUpdateSound';
import { uploadCustomSound } from '../../../custom-sounds/server/lib/uploadCustomSound';
import { getExtension, getMimeTypeFromFileName } from '../../../utils/lib/mimeTypes';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUploadFormData } from '../lib/getUploadFormData';

const createCustomSoundsResponse = ajv.compile<{ sound: Pick<ICustomSound, '_id'>; success: boolean }>({
	additionalProperties: false,
	type: 'object',
	properties: {
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
		sound: {
			type: 'object',
			properties: {
				_id: {
					type: 'string',
					description: 'The ID of the sound.',
				},
			},
			required: ['_id'],
		},
	},
	required: ['success', 'sound'],
});

const updateCustomSoundsResponse = ajv.compile<{ success: boolean }>({
	additionalProperties: false,
	type: 'object',
	properties: {
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success'],
});

const deleteCustomSoundsResponse = ajv.compile<void>({
	additionalProperties: false,
	type: 'object',
	properties: {
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success'],
});

const customSoundsEndpoints = API.v1
	.get(
		'custom-sounds.list',
		{
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile<
					PaginatedResult<{
						sounds: ICustomSound[];
					}>
				>({
					additionalProperties: false,
					type: 'object',
					properties: {
						count: {
							type: 'number',
							description: 'The number of sounds returned in this response.',
						},
						offset: {
							type: 'number',
							description: 'The number of sounds that were skipped in this response.',
						},
						total: {
							type: 'number',
							description: 'The total number of sounds that match the query.',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
						sounds: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/ICustomSound',
							},
						},
					},
					required: ['count', 'offset', 'total', 'sounds', 'success'],
				}),
			},
			query: isCustomSoundsListProps,
			authRequired: true,
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
			const { sort, query } = await this.parseJsonQuery();

			const { name } = this.queryParams;

			const filter = {
				...query,
				...(name ? { name: { $regex: escapeRegExp(name as string), $options: 'i' } } : {}),
			};

			const { cursor, totalCount } = CustomSounds.findPaginated(filter, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
			});
			const [sounds, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				sounds,
				count: sounds.length,
				offset,
				total,
			});
		},
	)
	.get(
		'custom-sounds.getOne',
		{
			response: {
				200: ajv.compile<{ sound: ICustomSound; success: boolean }>({
					additionalProperties: false,
					type: 'object',
					properties: {
						sound: {
							$ref: '#/components/schemas/ICustomSound',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['sound', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				404: validateNotFoundErrorResponse,
			},
			query: isCustomSoundsGetOneProps,
			authRequired: true,
		},
		async function action() {
			const { _id } = this.queryParams;

			const sound = await CustomSounds.findOneById(_id);

			if (!sound) {
				return API.v1.notFound('Custom Sound not found.');
			}

			return API.v1.success({ sound });
		},
	)
	.post(
		'custom-sounds.create',
		{
			response: {
				200: createCustomSoundsResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['manage-sounds'],
		},
		async function action() {
			const { fields, fileBuffer, filename } = await getUploadFormData(
				{
					request: this.request,
				},
				{
					field: 'sound',
					sizeLimit: MAX_CUSTOM_SOUND_SIZE_BYTES,
					validate: isCustomSoundsCreateProps,
				},
			);

			const computedMimeType = getMimeTypeFromFileName(filename);
			if (!CUSTOM_SOUND_ALLOWED_MIME_TYPES.includes(computedMimeType)) {
				return API.v1.failure('MIME type not allowed');
			}

			// We extract its extension from the name or use getExtension() as fallback.
			const soundExtension =
				(filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : undefined) || getExtension(computedMimeType);

			try {
				const _id = await insertOrUpdateSound({
					name: fields.name,
					extension: soundExtension,
				});
				await uploadCustomSound(fileBuffer, computedMimeType, { _id, name: fields.name, extension: soundExtension });
				return API.v1.success({ sound: { _id } });
			} catch (error) {
				SystemLogger.error({ error });
				return API.v1.failure(error instanceof Error ? error.message : 'Unknown error');
			}
		},
	)
	.post(
		'custom-sounds.update',
		{
			response: {
				200: updateCustomSoundsResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['manage-sounds'],
		},
		async function action() {
			const { fields, fileBuffer, filename } = await getUploadFormData(
				{
					request: this.request,
				},
				{
					field: 'sound',
					fileOptional: true,
					sizeLimit: MAX_CUSTOM_SOUND_SIZE_BYTES,
					validate: isCustomSoundsUpdateProps,
				},
			);

			let computedMimeType = '';
			if (fileBuffer) {
				computedMimeType = getMimeTypeFromFileName(filename);
				if (!CUSTOM_SOUND_ALLOWED_MIME_TYPES.includes(computedMimeType)) {
					return API.v1.failure('MIME type not allowed');
				}
			}

			const soundToUpdate = await CustomSounds.findOneById<Pick<ICustomSound, '_id' | 'name' | 'extension'>>(fields._id, {
				projection: { _id: 1, name: 1, extension: 1 },
			});
			if (!soundToUpdate) {
				return API.v1.failure('Custom Sound not found.');
			}

			// If new file, we'll extract its extension or use getExtension() as fallback. If there's no new file, we will keep the current extension.
			const nextExtension = fileBuffer
				? (filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : undefined) || getExtension(computedMimeType)
				: soundToUpdate.extension;

			try {
				if (fileBuffer) {
					await uploadCustomSound(fileBuffer, computedMimeType, {
						_id: fields._id,
						name: fields.name,
						previousExtension: soundToUpdate.extension,
						extension: nextExtension,
					});
				}
				await insertOrUpdateSound({
					_id: fields._id,
					name: fields.name,
					extension: nextExtension,
					previousName: soundToUpdate.name,
					previousExtension: soundToUpdate.extension,
				});
				return API.v1.success({});
			} catch (error) {
				SystemLogger.error({ error });
				return API.v1.failure(error instanceof Error ? error.message : 'Unknown error');
			}
		},
	)
	.post(
		'custom-sounds.delete',
		{
			response: {
				200: deleteCustomSoundsResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				404: validateNotFoundErrorResponse,
				500: validateInternalErrorResponse,
			},
			authRequired: true,
			body: isCustomSoundsDeleteProps,
			permissionsRequired: ['manage-sounds'],
		},
		async function action() {
			const { _id } = this.bodyParams;

			try {
				await deleteCustomSound(_id);

				return API.v1.success();
			} catch (error: unknown) {
				this.logger.error({ error });

				if (error instanceof Meteor.Error && error.error === 'Custom_Sound_Error_Invalid_Sound') {
					return API.v1.failure(error.error);
				}

				return API.v1.internalError();
			}
		},
	);

export type CustomSoundEndpoints = ExtractRoutesFromAPI<typeof customSoundsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CustomSoundEndpoints {}
}
