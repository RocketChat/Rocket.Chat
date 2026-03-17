import type { ICustomSound } from '@rocket.chat/core-typings';
import { CustomSounds } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import {
	isCustomSoundsGetOneProps,
	isCustomSoundsListProps,
	ajv,
	validateBadRequestErrorResponse,
	validateNotFoundErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

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
	);

export type CustomSoundEndpoints = ExtractRoutesFromAPI<typeof customSoundsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CustomSoundEndpoints {}
}
