import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

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
