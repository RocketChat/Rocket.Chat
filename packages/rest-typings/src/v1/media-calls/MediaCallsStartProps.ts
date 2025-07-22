import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type MediaCallsStartProps = { roomId: string; sessionId: string };

const mediaCallsStartPropsSchema: JSONSchemaType<MediaCallsStartProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: false,
		},
		sessionId: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['roomId', 'sessionId'],
	additionalProperties: true,
};

export const isMediaCallsStartProps = ajv.compile(mediaCallsStartPropsSchema);
