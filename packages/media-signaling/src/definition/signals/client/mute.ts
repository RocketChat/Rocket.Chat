import type { JSONSchemaType } from 'ajv';

/**
 * Client is requesting its own leg of the call to be muted/unmuted.
 * For webrtc calls muting is handled locally on the client, so this signal is only used by services
 * where the media lives elsewhere (e.g. `cti`) and the mute must be applied by the call backend.
 */
export type ClientMediaSignalMute = {
	callId: string;
	type: 'mute';
	contractId: string;

	muted: boolean;
};

export const clientMediaSignalMuteSchema: JSONSchemaType<ClientMediaSignalMute> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		contractId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		type: {
			type: 'string',
			const: 'mute',
		},
		muted: {
			type: 'boolean',
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'muted'],
};
