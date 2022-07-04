import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
	coerceTypes: true,
});

addFormats(ajv, ['date', 'time']);

export type RoomsGetParamsGET = {
	updatedSince: string;
};

const RoomsGetParamsGETSchema = {
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

export const isRoomsGetParamsGET = ajv.compile<RoomsGetParamsGET>(RoomsGetParamsGETSchema);
