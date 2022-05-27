import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv();

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

export const isCustomSoundsListProps = ajv.compile(CustomSoundsListSchema);

export type CustomSoundEndpoint = {
	'custom-sounds.list': {
		GET: (params: CustomSoundsList) => PaginatedResult<{
			sounds: {
				_id: string;
				name: string;
				extension: string;
			}[];
		}>;
	};
};
