import type { ICustomSound } from '@rocket.chat/core-typings';
import { CustomSounds } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import {
	isCustomSoundsGetOneProps,
	isCustomSoundsListProps,
	isCustomSoundsCreateProps,
	isCustomSoundsUpdateProps,
	ajv,
	validateBadRequestErrorResponse,
	validateNotFoundErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { MAX_CUSTOM_SOUND_SIZE_BYTES } from '../../../../lib/constants';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { insertOrUpdateSound } from '../../../custom-sounds/server/lib/insertOrUpdateSound';
import { uploadCustomSound } from '../../../custom-sounds/server/lib/uploadCustomSound';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUploadFormData } from '../lib/getUploadFormData';

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
				...(name ? { name: { $regex: escapeRegExp(name), $options: 'i' } } : {}),
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
				200: ajv.compile<{ sound: Pick<ICustomSound, '_id'>; success: boolean }>({
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
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['manage-sounds'],
		},
		async function action() {
			const sound = await getUploadFormData(
				{
					request: this.request,
				},
				{
					field: 'sound',
					sizeLimit: MAX_CUSTOM_SOUND_SIZE_BYTES,
					validate: isCustomSoundsCreateProps,
				},
			);

			const { fields, fileBuffer, mimetype } = sound;

			let _id;

			try {
				_id = await insertOrUpdateSound({
					name: fields.name,
					extension: fields.extension,
				});
				await uploadCustomSound(fileBuffer, mimetype, { _id, name: fields.name, extension: fields.extension });
			} catch (error) {
				SystemLogger.error({ error });
				return API.v1.failure(error instanceof Error ? error.message : 'Unknown error');
			}
			return API.v1.success({ sound: { _id } });
		},
	)
	.post(
		'custom-sounds.update',
		{
			response: {
				200: ajv.compile<{ success: boolean }>({
					additionalProperties: false,
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['manage-sounds'],
		},
		async function action() {
			const sound = await getUploadFormData(
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

			const { fields, fileBuffer, mimetype } = sound;

			const soundToUpdate = await CustomSounds.findOneById<Pick<ICustomSound, '_id' | 'name' | 'extension'>>(fields._id, {
				projection: { _id: 1, name: 1, extension: 1 },
			});
			if (!soundToUpdate) {
				return API.v1.failure('Custom Sound not found.');
			}

			try {
				await insertOrUpdateSound({
					_id: fields._id,
					name: fields.name,
					extension: fields.extension,
					newFile: Boolean(fields.newFile),
					previousName: soundToUpdate.name,
					previousExtension: soundToUpdate.extension,
				});
				if (fileBuffer) {
					await uploadCustomSound(fileBuffer, mimetype, { _id: fields._id, name: fields.name, extension: fields.extension });
				}
			} catch (error) {
				SystemLogger.error({ error });
				return API.v1.failure(error instanceof Error ? error.message : 'Unknown error');
			}
			return API.v1.success({});
		},
	);

export type CustomSoundEndpoints = ExtractRoutesFromAPI<typeof customSoundsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CustomSoundEndpoints {}
}
