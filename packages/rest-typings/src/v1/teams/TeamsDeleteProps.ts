import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsDeleteProps = ({ teamId: string } | { teamName: string }) & {
	roomsToRemove?: string[];
};

const teamsDeletePropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: {
					type: 'string',
				},
				roomsToRemove: {
					type: 'array',
					items: {
						type: 'string',
					},
					minItems: 1,
					uniqueItems: true,
					nullable: true,
				},
			},
			required: ['teamId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				teamName: {
					type: 'string',
				},
				roomsToRemove: {
					type: 'array',
					items: {
						type: 'string',
					},
					minItems: 1,
					uniqueItems: true,
					nullable: true,
				},
			},
			required: ['teamName'],
			additionalProperties: false,
		},
	],
};

export const isTeamsDeleteProps = ajv.compile<TeamsDeleteProps>(teamsDeletePropsSchema);
