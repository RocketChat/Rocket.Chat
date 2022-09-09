import type { ICustomSound } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

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

export const isCustomSoundsListSchemaProps = ajv.compile<CustomSoundsList>(CustomSoundsListSchema);

type UploadCustomSound = {
	binaryContent: string;
	contentType: string;
	soundData: Record<string, unknown>;
};

const UploadCustomSoundSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		extension: {
			type: 'object',
		},
	},
	required: ['name', 'extension'],
	additionalProperties: false,
};

export const isUploadCustomSoundProps = ajv.compile<UploadCustomSound>(UploadCustomSoundSchema);

export type CustomSoundEndpoint = {
	'/v1/custom-sounds.list': {
		GET: (params: CustomSoundsList) => PaginatedResult<{
			sounds: ICustomSound[];
		}>;
	};

	'/v1/custom-sounds.uploadCustomSound': {
		POST: (params: UploadCustomSound) => void;
	};
};
