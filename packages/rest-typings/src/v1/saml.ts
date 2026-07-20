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

export type SamlParseMetadataResult = {
	entryPoint?: string;
	idpSLORedirectURL?: string;
	cert?: string;
	identifierFormat?: string;
	warnings: string[];
};
