import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type MediaCallsStartProps = { contractId: string; identifier: string; identifierKind: 'user' | 'extension' };

const mediaCallsStartPropsSchema: JSONSchemaType<MediaCallsStartProps> = {
	type: 'object',
	properties: {
		contractId: {
			type: 'string',
			nullable: false,
		},
		identifier: {
			type: 'string',
			nullable: false,
		},
		identifierKind: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['contractId', 'identifier', 'identifierKind'],
	additionalProperties: false,
};

export const isMediaCallsStartProps = ajv.compile(mediaCallsStartPropsSchema);
