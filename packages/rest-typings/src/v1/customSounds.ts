import type { ICustomSound } from '@rocket.chat/core-typings';

import { ajv } from './Ajv';

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

export const isCustomSoundsGetOneProps = ajv.compile<CustomSoundsGetOne>(CustomSoundsGetOneSchema);

type CustomSoundsCreate = { _id: ICustomSound['_id'] };

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

type CustomSoundsUpdate = { _id: ICustomSound['_id'] };

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
    newFile: {
      type: 'boolean',
    }
	},
	required: ['_id', 'name'],
	additionalProperties: false,
};

export const isCustomSoundsUpdateProps = ajv.compile<CustomSoundsUpdate>(CustomSoundsUpdateSchema);

type CustomSoundsDelete = { _id: ICustomSound['_id'] };

const CustomSoundsDeleteSchema = {
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

export const isCustomSoundsDeleteProps = ajv.compile<CustomSoundsDelete>(CustomSoundsDeleteSchema);
