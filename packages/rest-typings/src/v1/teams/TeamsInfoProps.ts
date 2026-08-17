import { ajvQuery } from '../Ajv';

export type TeamsInfoProps = { teamId: string } | { teamName: string };

const teamsInfoPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
	},
	oneOf: [
		{ type: 'object', required: ['teamId'] },
		{ type: 'object', required: ['teamName'] },
	],
	additionalProperties: false,
};

export const isTeamsInfoProps = ajvQuery.compile<TeamsInfoProps>(teamsInfoPropsSchema);
