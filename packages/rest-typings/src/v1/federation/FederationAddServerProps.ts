import { ajv } from '../Ajv';

export type FederationAddServerProps = {
	serverName: string;
};

const FederationAddServerPropsSchema = {
	type: 'object',
	properties: {
		serverName: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['serverName'],
};

export const isFederationAddServerProps = ajv.compile<FederationAddServerProps>(FederationAddServerPropsSchema);
