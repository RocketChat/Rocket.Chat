import { ajv } from '../../helpers/schemas';

export type FederationRemoveServerProps = {
	serverName: string;
};

const FederationRemoveServerPropsSchema = {
	type: 'object',
	properties: {
		serverName: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['serverName'],
};

export const isFederationRemoveServerProps = ajv.compile<FederationRemoveServerProps>(FederationRemoveServerPropsSchema);
