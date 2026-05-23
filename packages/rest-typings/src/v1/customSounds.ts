import type { ICustomSound } from '@rocket.chat/core-typings';

import { ajvQuery, ajv } from './Ajv';
import { type PaginatedRequest } from '../helpers/PaginatedRequest';

type CustomSoundsGetOne = { _id: ICustomSound['_id'] };

const CustomSoundsGetOneSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['_id'],
	additionalProperties: false,
};

export const isCustomSoundsGetOneProps = ajvQuery.compile<CustomSoundsGetOne>(CustomSoundsGetOneSchema);

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

export const isCustomSoundsListProps = ajvQuery.compile<CustomSoundsList>(CustomSoundsListSchema);

type CustomSoundsCreate = Pick<ICustomSound, 'name'>;

const CustomSoundsCreateSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isCustomSoundsCreateProps = ajv.compile<CustomSoundsCreate>(CustomSoundsCreateSchema);

type CustomSoundsUpdate = Pick<ICustomSound, '_id' | 'name'>;

const CustomSoundsUpdateSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			minLength: 1,
		},
		name: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['_id', 'name'],
	additionalProperties: false,
};

export const isCustomSoundsUpdateProps = ajv.compile<CustomSoundsUpdate>(CustomSoundsUpdateSchema);
