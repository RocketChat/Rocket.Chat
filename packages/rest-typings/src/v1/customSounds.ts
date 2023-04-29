import type { ICustomSound } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';
import { ajv } from '../helpers/schemas';

type CustomSoundsList = PaginatedRequest<{ query: string }>;

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
		query: {
			type: 'string',
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isCustomSoundsListProps = ajv.compile<CustomSoundsList>(CustomSoundsListSchema);

export type CustomSoundEndpoint = {
	'/v1/custom-sounds.list': {
		GET: (params: CustomSoundsList) => PaginatedResult<{
			sounds: ICustomSound[];
		}>;
	};
};
