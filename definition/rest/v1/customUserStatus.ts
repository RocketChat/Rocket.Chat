import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

type customUserStatusList = {
	query: string;
};

const customUserStatusListSchema: JSONSchemaType<customUserStatusList> = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const iscustomUserStatusList = ajv.compile(customUserStatusListSchema);

export type CustomUserStatusEndpoints = {
	'custom-user-status.list': {
		GET: (params: customUserStatusList) => {
			statuses: string[];
		};
	};
};
