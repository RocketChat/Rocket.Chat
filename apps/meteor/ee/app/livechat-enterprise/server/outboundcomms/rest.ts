import type { IOutboundMessage } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { OutboundCommsEndpoints } from '/ee/app/livechat-enterprise/server/api/outbound';

const ajv = new Ajv({
	coerceTypes: true,
});

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints extends OutboundCommsEndpoints {}
}

type GETOutboundProviderParams = { type?: string };
const GETOutboundProviderSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			enum: ['phone', 'email'],
		},
	},
	required: [],
	additionalProperties: false,
};
export const isGETOutboundProviderParams = ajv.compile<GETOutboundProviderParams>(GETOutboundProviderSchema);

type POSTOutboundMessageParams = {
	message: IOutboundMessage;
};
const POSTOutboundMessageSchema = {
	type: 'object',
	required: ['to', 'type'],
	properties: {
		to: { type: 'string' },
		type: { type: 'string' },
		templateProviderPhoneNumber: { type: 'string' },
		template: {
			type: 'object',
			required: ['name', 'language'],
			properties: {
				name: { type: 'string' },
				language: {
					type: 'object',
					required: ['code'],
					properties: {
						code: { type: 'string' },
						policy: {
							type: 'string',
							enum: ['deterministic', 'fallback'],
						},
					},
					additionalProperties: false,
				},
				components: {
					type: 'array',
					items: {
						type: 'object',
						required: ['type', 'parameters'],
						properties: {
							type: {
								type: 'string',
								enum: ['header', 'body', 'footer', 'button'],
							},
							parameters: {
								type: 'array',
								items: {
									oneOf: [
										{
											type: 'object',
											required: ['type', 'text'],
											properties: {
												type: { const: 'text' },
												text: { type: 'string' },
											},
											additionalProperties: false,
										},
										{
											type: 'object',
											required: ['type', 'currency'],
											properties: {
												type: { const: 'currency' },
												currency: {
													type: 'object',
													required: ['fallbackValue', 'code', 'amount1000'],
													properties: {
														fallbackValue: { type: 'string' },
														code: { type: 'string' },
														amount1000: { type: 'number' },
													},
													additionalProperties: false,
												},
											},
											additionalProperties: false,
										},
										{
											type: 'object',
											required: ['type', 'dateTime'],
											properties: {
												type: { const: 'date_time' },
												dateTime: {
													type: 'object',
													required: ['fallbackValue'],
													properties: {
														fallbackValue: { type: 'string' },
														timestamp: { type: 'number' },
														dayOfWeek: { type: 'number' },
														dayOfMonth: { type: 'number' },
														year: { type: 'number' },
														month: { type: 'number' },
														hour: { type: 'number' },
														minute: { type: 'number' },
													},
													additionalProperties: false,
												},
											},
											additionalProperties: false,
										},
										{
											type: 'object',
											required: ['type', 'link'],
											properties: {
												type: { const: 'media' },
												link: { type: 'string' },
											},
											additionalProperties: false,
										},
									],
								},
							},
						},
						additionalProperties: false,
					},
				},
				namespace: { type: 'string' },
			},
			additionalProperties: false,
		},
	},
	additionalProperties: false,
};

export const isPOSTOutboundMessageParams = ajv.compile<POSTOutboundMessageParams>(POSTOutboundMessageSchema);
