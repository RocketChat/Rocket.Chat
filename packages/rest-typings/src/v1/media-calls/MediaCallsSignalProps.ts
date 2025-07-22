import { mediaSignalSchema, type MediaSignal } from '@rocket.chat/media-signaling';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type MediaCallsSignalProps = { signal: MediaSignal };

const mediaCallsSignalPropsSchema: JSONSchemaType<MediaCallsSignalProps> = {
	type: 'object',
	properties: {
		signal: mediaSignalSchema,
	},
	required: ['signal'],
	additionalProperties: true,
};

export const isMediaCallsSignalProps = ajv.compile(mediaCallsSignalPropsSchema);
