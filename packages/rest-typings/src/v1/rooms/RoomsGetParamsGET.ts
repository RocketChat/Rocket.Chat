import { ajv } from '../../Ajv';

export type GETRoomsGet = {
	updatedSince: string;
};

const GETRoomsGetSchema = {
	type: 'object',
	properties: {
		updatedSince: {
			type: 'string',
			format: 'date',
			// Maybe we could remove the if(isNaN(Date.parse(...))) check in the rooms.ts file with this extra validation on the Ajv?
		},
	},
	additionalProperties: false,
	required: ['updatedSince'],
};

export const isGETRoomsGet = ajv.compile<GETRoomsGet>(GETRoomsGetSchema);
