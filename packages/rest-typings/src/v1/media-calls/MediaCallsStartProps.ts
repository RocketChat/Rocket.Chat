import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type MediaCallsStartProps = { sessionId: string; identifier: string; identifierKind: 'room' | 'user' | 'extension' };

const mediaCallsStartPropsSchema: JSONSchemaType<MediaCallsStartProps> = {
	type: 'object',
	properties: {
		sessionId: {
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
	required: ['sessionId', 'identifier', 'identifierKind'],
	additionalProperties: true,
};

export const isMediaCallsStartProps = ajv.compile(mediaCallsStartPropsSchema);
