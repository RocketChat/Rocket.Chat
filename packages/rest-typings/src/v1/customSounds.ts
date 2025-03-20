import type { ICustomSound } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

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

export type CustomSoundEndpoint = {
	'/v1/custom-sounds.list': {
		GET: (params: CustomSoundsList) => PaginatedResult<{
			sounds: ICustomSound[];
		}>;
	};
};
