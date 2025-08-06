import { ajv } from '../Ajv';

export type TeamsConvertToChannelProps = {
	roomsToRemove?: string[];
} & ({ teamId: string } | { teamName: string });

const teamsConvertToTeamsPropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',

			properties: {
				roomsToRemove: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				teamId: {
					type: 'string',
				},
			},
			required: ['teamId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomsToRemove: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				teamName: {
					type: 'string',
				},
			},
			required: ['teamName'],
			additionalProperties: false,
		},
	],
};

export const isTeamsConvertToChannelProps = ajv.compile<TeamsConvertToChannelProps>(teamsConvertToTeamsPropsSchema);
