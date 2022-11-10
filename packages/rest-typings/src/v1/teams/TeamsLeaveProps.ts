import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsLeaveProps = ({ teamId: string } | { teamName: string }) & { rooms?: string[] };

const teamsLeavePropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: {
					type: 'string',
				},
				rooms: {
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
				rooms: {
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

export const isTeamsLeaveProps = ajv.compile<TeamsLeaveProps>(teamsLeavePropsSchema);
