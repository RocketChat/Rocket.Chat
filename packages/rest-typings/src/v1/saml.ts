import { ajv } from './Ajv';

type SamlParseMetadataProps = {
	url: string;
};

const samlParseMetadataPropsSchema = {
	type: 'object',
	properties: {
		url: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['url'],
	additionalProperties: false,
};

export const isSamlParseMetadata = ajv.compile<SamlParseMetadataProps>(samlParseMetadataPropsSchema);

type SamlParseMetadataResult = {
	entryPoint?: string;
	idpSLORedirectURL?: string;
	cert?: string;
	identifierFormat?: string;
	warnings: string[];
};

const samlParseMetadataSuccessResponseSchema = {
	type: 'object',
	properties: {
		entryPoint: { type: 'string' },
		idpSLORedirectURL: { type: 'string' },
		cert: { type: 'string' },
		identifierFormat: { type: 'string' },
		warnings: { type: 'array', items: { type: 'string' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['warnings', 'success'],
	additionalProperties: false,
};

export const validateSamlParseMetadataSuccessResponse = ajv.compile<SamlParseMetadataResult & { success: true }>(
	samlParseMetadataSuccessResponseSchema,
);
