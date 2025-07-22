import type { JSONSchemaType } from 'ajv';

import { mediaSignalHeaderParamsSchema, type MediaSignalHeader } from './MediaSignalHeader';

export type NotifyAckBody = {
	notify: 'ack';
};

export const notifyAckBodySchema: JSONSchemaType<NotifyAckBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'ack',
		},
	},
	required: ['notify'],
	additionalProperties: false,
};

// export type NotifyInvalidBody = {
// 	notify: 'invalid';
// };

// export type NotifyUnableBody = {
// 	notify: 'unable';
// };

// export type NotifyEmptyBody = {
// 	notify: 'empty';
// };

export type NotifyErrorBody = {
	notify: 'error';
	errorCode: string;
	errorText?: string;
};

export const notifyErrorBodySchema: JSONSchemaType<NotifyErrorBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'error',
		},
		errorCode: {
			type: 'string',
			nullable: false,
		},
		errorText: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['notify', 'errorCode'],
	additionalProperties: false,
};

export type NotifyNewBody = {
	notify: 'new';
	service: 'webrtc';
	kind: 'direct';
};

export const notifyNewBodySchema: JSONSchemaType<NotifyNewBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'new',
		},
		service: {
			type: 'string',
			pattern: 'webrtc',
		},
		kind: {
			type: 'string',
			pattern: 'direct',
		},
	},
	required: ['notify', 'service', 'kind'],
	additionalProperties: false,
};

export type NotifyStateBody = {
	notify: 'state';
	callState?: string;
	serviceState?: string;
	mediaState?: string;
};

export const notifyStateBodySchema: JSONSchemaType<NotifyStateBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'state',
		},
		callState: {
			type: 'string',
			nullable: true,
		},
		serviceState: {
			type: 'string',
			nullable: true,
		},
		mediaState: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['notify'],
	additionalProperties: false,
};

export type NotifyUnavailableBody = {
	notify: 'unavailable';
};

export const notifyUnavailableBodySchema: JSONSchemaType<NotifyUnavailableBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'unavailable',
		},
	},
	required: ['notify'],
	additionalProperties: false,
};

export type NotifyAcceptBody = {
	notify: 'accept';
};

export const notifyAcceptBodySchema: JSONSchemaType<NotifyAcceptBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'accept',
		},
	},
	required: ['notify'],
	additionalProperties: false,
};

export type NotifyRejectBody = {
	notify: 'reject';
};

export const notifyRejectBodySchema: JSONSchemaType<NotifyRejectBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'reject',
		},
	},
	required: ['notify'],
	additionalProperties: false,
};

export type NotifyHangupBody = {
	notify: 'hangup';
	reasonCode: string;
	reasonText?: string;
};

export const notifyHangupBodySchema: JSONSchemaType<NotifyHangupBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'hangup',
		},
		reasonCode: {
			type: 'string',
			nullable: false,
		},
		reasonText: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['notify', 'reasonCode'],
	additionalProperties: false,
};

export type NotifyNegotiationNeededBody = {
	notify: 'negotiation-needed';
	reason?: string;
};

export const notifyNegotiationNeededBodySchema: JSONSchemaType<NotifyNegotiationNeededBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'negotiation-needed',
		},
		reason: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['notify'],
	additionalProperties: false,
};

export type NotifyMultiBody = {
	notify: 'multi';
	notifications: NotifyBody<keyof Omit<NotifyBodyMap, 'multi'>>[];
};

const notifySingleBodySchemas = [
	notifyAckBodySchema,
	notifyNewBodySchema,
	notifyErrorBodySchema,
	notifyAcceptBodySchema,
	notifyRejectBodySchema,
	notifyHangupBodySchema,
	notifyNegotiationNeededBodySchema,
	notifyUnavailableBodySchema,
	notifyStateBodySchema,
];

export const notifyMultiBodySchema: JSONSchemaType<NotifyMultiBody> = {
	type: 'object',
	properties: {
		notify: {
			type: 'string',
			pattern: 'multi',
		},
		notifications: {
			type: 'array',
			items: {
				type: 'object',
				anyOf: notifySingleBodySchemas,
			},
		},
	},
	required: ['notify'],
	additionalProperties: false,
};

const notifyAnyBodySchema = [...notifySingleBodySchemas, notifyMultiBodySchema];

export type NotifyBodyMap = {
	'new': NotifyNewBody;
	'ack': NotifyAckBody;
	// 'invalid': NotifyInvalidBody;
	// 'unable': NotifyUnableBody;
	// 'empty': NotifyEmptyBody;
	'error': NotifyErrorBody;
	'accept': NotifyAcceptBody;
	'reject': NotifyRejectBody;
	'hangup': NotifyHangupBody;
	'negotiation-needed': NotifyNegotiationNeededBody;
	'unavailable': NotifyUnavailableBody;
	'state': NotifyStateBody;
	'multi': NotifyMultiBody;
};

export type NotifyType = keyof NotifyBodyMap;

export type NotifyBody<T extends NotifyType = NotifyType> = NotifyBodyMap[T];

export type MediaSignalNotify<T extends NotifyType = NotifyType> = MediaSignalHeader & {
	type: 'notify';
	body: NotifyBody<T>;
};

export type NotifyParams<T extends NotifyType = NotifyType> = Omit<NotifyBody<T>, 'notify'>;

export const mediaSignalNotifySchema: JSONSchemaType<MediaSignalNotify> = {
	type: 'object',
	allOf: [
		mediaSignalHeaderParamsSchema,
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					pattern: 'notify',
				},
				body: {
					type: 'object',
					oneOf: notifyAnyBodySchema,
					additionalProperties: false,
				},
			},
			required: ['type', 'body'],
			additionalProperties: false,
		},
	],
	required: [...mediaSignalHeaderParamsSchema.required, 'type', 'body'],
};
