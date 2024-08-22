import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

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
