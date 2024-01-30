import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsInfoProps = { teamId: string } | { teamName: string };

const teamsInfoPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
	},
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
	additionalProperties: false,
};

export const isTeamsInfoProps = ajv.compile<TeamsInfoProps>(teamsInfoPropsSchema);
