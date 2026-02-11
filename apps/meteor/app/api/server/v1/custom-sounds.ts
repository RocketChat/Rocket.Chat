import type { ICustomSound } from '@rocket.chat/core-typings';
import { CustomSounds } from '@rocket.chat/models';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type CustomSoundsList = PaginatedRequest<{ name?: string }>;

const CustomSoundsListSchema = {
	type: 'object',
	properties: {
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		name: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isCustomSoundsListProps = ajv.compile<CustomSoundsList>(CustomSoundsListSchema);

type CustomSoundsGetOne = { _id: ICustomSound['_id'] };

const CustomSoundsGetOneSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
	},
	required: ['_id'],
	additionalProperties: false,
};

export const isCustomSoundsGetOneProps = ajv.compile<CustomSoundsGetOne>(CustomSoundsGetOneSchema);

const customSoundsEndpoints = API.v1
	.get(
		'custom-sounds.list',
		{
			response: {
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
				200: ajv.compile<{ _id: ICustomSound['_id']; name: ICustomSound['name'] }>({
					additionalProperties: false,
					type: 'object',
					properties: {
						_id: {
							type: 'string',
							description: 'The ID of the custom sound.',
						},
						name: {
							type: 'string',
							description: 'The name of the custom sound.',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['_id', 'name', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				404: validateNotFoundErrorResponse,
			},
			query: isCustomSoundsGetOneProps,
			authRequired: true,
		},
		async function action() {
			const { _id } = this.queryParams;

			const customSound = await CustomSounds.findOneById(_id);

			if (!customSound) {
				return API.v1.notFound('Custom Sound not found.');
			}

			return API.v1.success({
				_id: customSound._id,
				name: customSound.name,
			});
		},
	);

export type CustomSoundEndpoints = ExtractRoutesFromAPI<typeof customSoundsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CustomSoundEndpoints {}
}
