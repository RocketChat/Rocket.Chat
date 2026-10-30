import { Ajv, type JSONSchemaType } from 'ajv';

import { clientMediaSignalAnswerSchema, type ClientMediaSignalAnswer } from './answer.js';
import { clientMediaSignalDTMFSchema, type ClientMediaSignalDTMF } from './dtmf.js';
import { clientMediaSignalErrorSchema, type ClientMediaSignalError } from './error.js';
import { clientMediaSignalHangupSchema, type ClientMediaSignalHangup } from './hangup.js';
import { clientMediaSignalLocalSDPSchema, type ClientMediaSignalLocalSDP } from './local-sdp.js';
import { clientMediaSignalLocalStateSchema, type ClientMediaSignalLocalState } from './local-state.js';
import { clientMediaSignalNegotiationNeededSchema, type ClientMediaSignalNegotiationNeeded } from './negotiation-needed.js';
import { clientMediaSignalRegisterSchema, type ClientMediaSignalRegister } from './register.js';
import { clientMediaSignalRequestCallSchema, type ClientMediaSignalRequestCall } from './request-call.js';
import { clientMediaSignalTransferSchema, type ClientMediaSignalTransfer } from './transfer.js';

const ajv = new Ajv({ discriminator: true });

export type ClientMediaSignal =
	| ClientMediaSignalLocalSDP
	| ClientMediaSignalError
	| ClientMediaSignalAnswer
	| ClientMediaSignalHangup
	| ClientMediaSignalDTMF
	| ClientMediaSignalRequestCall
	| ClientMediaSignalLocalState
	| ClientMediaSignalRegister
	| ClientMediaSignalNegotiationNeeded
	| ClientMediaSignalTransfer;

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
		clientMediaSignalDTMFSchema,
		clientMediaSignalRequestCallSchema,
		clientMediaSignalLocalStateSchema,
		clientMediaSignalRegisterSchema,
		clientMediaSignalNegotiationNeededSchema,
		clientMediaSignalTransferSchema,
	],
};

export const isClientMediaSignal = ajv.compile(clientMediaSignalSchema);

export type ClientMediaSignalType = ClientMediaSignal['type'];

type ExtractMediaSignal<T, K extends ClientMediaSignalType> = T extends { type: K } ? T : never;

export type GenericClientMediaSignal<K extends ClientMediaSignalType> = ExtractMediaSignal<ClientMediaSignal, K>;

export type ClientMediaSignalBody<K extends ClientMediaSignalType = ClientMediaSignalType> = Omit<
	GenericClientMediaSignal<K>,
	'callId' | 'contractId' | 'type'
>;
