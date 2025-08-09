import type { JSONSchemaType } from 'ajv';

// Client is sending the local session description to the server
export type ClientMediaSignalLocalSDP = {
	callId: string;
	contractId: string;
	type: 'local-sdp';

	sdp: RTCSessionDescriptionInit;
};

export const clientMediaSignalLocalSDPSchema: JSONSchemaType<ClientMediaSignalLocalSDP> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		contractId: {
			type: 'string',
			nullable: false,
		},
		type: {
			type: 'string',
			const: 'local-sdp',
		},
		sdp: {
			type: 'object',
			properties: {
				sdp: {
					type: 'string',
					nullable: true,
				},
				type: {
					type: 'string',
					nullable: false,
				},
			},
			additionalProperties: false,
			nullable: false,
			required: ['type'],
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'sdp'],
};
