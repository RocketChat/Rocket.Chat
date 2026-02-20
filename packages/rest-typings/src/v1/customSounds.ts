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
