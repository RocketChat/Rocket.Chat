import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type TeamsEraseRoomProps = {
	rid: string;
};

const TeamsEraseRoomPropsSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isTeamsEraseRoomProps = ajv.compile<TeamsEraseRoomProps>(TeamsEraseRoomPropsSchema);
