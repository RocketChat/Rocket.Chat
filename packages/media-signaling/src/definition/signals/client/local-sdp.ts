import type { JSONSchemaType } from 'ajv';

import type { MediaStreamIdentification } from '../../media/MediaStreamIdentification';

/** Client is sending the local session description to the server */
export type ClientMediaSignalLocalSDP = {
	callId: string;
	contractId: string;
	type: 'local-sdp';

	sdp: RTCSessionDescriptionInit;
	negotiationId: string;
	streams?: MediaStreamIdentification[];
};

export const clientMediaSignalLocalSDPSchema: JSONSchemaType<ClientMediaSignalLocalSDP> = {
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
					enum: ['offer', 'answer', 'pranswer', 'rollback'],
					nullable: false,
				},
			},
			additionalProperties: false,
			nullable: false,
			required: ['type'],
		},
		negotiationId: {
			type: 'string',
			nullable: false,
		},
		streams: {
			type: 'array',
			nullable: true,
			items: {
				type: 'object',
				properties: {
					tag: {
						type: 'string',
						minLength: 1,
					},
					id: {
						type: 'string',
						minLength: 1,
					},
				},
				additionalProperties: false,
				required: ['tag', 'id'],
			},
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'sdp', 'negotiationId'],
};
