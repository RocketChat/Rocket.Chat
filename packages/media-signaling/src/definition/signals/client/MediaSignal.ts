import { Ajv, type JSONSchemaType } from 'ajv';

import { clientMediaSignalAnswerSchema, type ClientMediaSignalAnswer } from './answer';
import { clientMediaSignalErrorSchema, type ClientMediaSignalError } from './error';
import { clientMediaSignalHangupSchema, type ClientMediaSignalHangup } from './hangup';
import { clientMediaSignalLocalSDPSchema, type ClientMediaSignalLocalSDP } from './local-sdp';
import { clientMediaSignalLocalStateSchema, type ClientMediaSignalLocalState } from './local-state';
import { clientMediaSignalRequestCallSchema, type ClientMediaSignalRequestCall } from './request-call';

const ajv = new Ajv({ discriminator: true });

export type ClientMediaSignal =
	| ClientMediaSignalLocalSDP
	| ClientMediaSignalError
	| ClientMediaSignalAnswer
	| ClientMediaSignalHangup
	| ClientMediaSignalRequestCall
	| ClientMediaSignalLocalState;

export const clientMediaSignalSchema: JSONSchemaType<ClientMediaSignal> = {
	type: 'object',
	additionalProperties: true,
	discriminator: { propertyName: 'type' },
	required: ['type'],
	oneOf: [
		clientMediaSignalLocalSDPSchema,
		clientMediaSignalErrorSchema,
		clientMediaSignalAnswerSchema,
		clientMediaSignalHangupSchema,
		clientMediaSignalRequestCallSchema,
		clientMediaSignalLocalStateSchema,
	],
} as const;

export const isClientMediaSignal = ajv.compile(clientMediaSignalSchema);

export type ClientMediaSignalType = ClientMediaSignal['type'];

type ExtractMediaSignal<T, K extends ClientMediaSignalType> = T extends { type: K } ? T : never;

export type GenericClientMediaSignal<K extends ClientMediaSignalType> = ExtractMediaSignal<ClientMediaSignal, K>;

export type ClientMediaSignalBody<K extends ClientMediaSignalType = ClientMediaSignalType> = Omit<
	GenericClientMediaSignal<K>,
	'callId' | 'contractId' | 'type'
>;
