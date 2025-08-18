import type { IOutboundMessage, IOutboundProvider, IOutboundProviderMetadata, ValidOutboundProvider } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { OutboundCommsEndpoints } from '../api/outbound';

const ajv = new Ajv({
	coerceTypes: true,
});

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends OutboundCommsEndpoints {}
}

type GenericErrorResponse = { success: boolean; message: string };

type GETOutboundProviderParams = { type?: ValidOutboundProvider };
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
export const GETOutboundProviderParamsSchema = ajv.compile<GETOutboundProviderParams>(GETOutboundProviderSchema);

const GETOutboundProvidersResponse = {
	type: 'object',
	properties: {
		providers: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					providerId: {
						type: 'string',
					},
					providerName: {
						type: 'string',
					},
					supportsTemplates: {
						type: 'boolean',
					},
					providerType: {
						type: 'string',
					},
				},
			},
		},
	},
};
export const GETOutboundProvidersResponseSchema = ajv.compile<{ providers: IOutboundProvider[] }>(GETOutboundProvidersResponse);

const GETOutboundProviderBadRequestError = {
	type: 'object',
	properties: {
		success: {
			type: 'boolean',
		},
		message: {
			type: 'string',
		},
	},
};
export const GETOutboundProviderBadRequestErrorSchema = ajv.compile<GenericErrorResponse>(GETOutboundProviderBadRequestError);

type POSTOutboundMessageParamsType = IOutboundMessage;

const POSTOutboundMessageSchema = {
	type: 'object',
	required: ['to', 'type'],
	properties: {
		to: { type: 'string', minLength: 1 },
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
		// departmentId should only be required if agentId is provided
		agentId: { type: 'string' },
		departmentId: { type: 'string' },
	},
	additionalProperties: false,
};

export const POSTOutboundMessageParams = ajv.compile<POSTOutboundMessageParamsType>(POSTOutboundMessageSchema);

const POSTOutboundMessageSuccess = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	additionalProperties: false,
};

export const POSTOutboundMessageSuccessSchema = ajv.compile<void>(POSTOutboundMessageSuccess);

const OutboundProviderMetadataSchema = {
	type: 'object',
	properties: {
		metadata: {
			type: 'object',
			properties: {
				providerId: {
					type: 'string',
				},
				providerName: {
					type: 'string',
				},
				supportsTemplates: {
					type: 'boolean',
				},
				providerType: {
					type: 'string',
					enum: ['phone', 'email'],
				},
				templates: {
					type: 'object',
					additionalProperties: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: {
									type: 'string',
								},
								name: {
									type: 'string',
								},
								language: {
									type: 'string',
								},
								type: {
									type: 'string',
								},
								category: {
									type: 'string',
								},
								status: {
									type: 'string',
								},
								qualityScore: {
									type: 'object',
									required: ['score', 'reasons'],
									properties: {
										score: {
											type: 'string',
											enum: ['GREEN', 'YELLOW', 'RED', 'UNKNOWN'],
										},
										reasons: {
											type: ['array', 'null'],
											items: {
												type: 'string',
											},
										},
									},
								},
								components: {
									type: 'array',
									items: {
										type: 'object',
										oneOf: [
											{
												properties: {
													type: { const: 'header' },
													format: {
														type: 'string',
														enum: ['text', 'image', 'video', 'document'],
													},
													text: { type: 'string' },
													example: {
														type: 'object',
														properties: {
															headerText: {
																type: 'array',
																items: { type: 'string' },
															},
														},
													},
												},
											},
											{
												properties: {
													type: { const: 'body' },
													text: { type: 'string' },
													example: {
														type: 'object',
														properties: {
															bodyText: {
																type: 'array',
																items: {
																	type: 'array',
																	items: { type: 'string' },
																},
															},
														},
													},
												},
												required: ['type', 'text'],
											},
											{
												properties: {
													type: { const: 'footer' },
													text: { type: 'string' },
												},
												required: ['type', 'text'],
											},
										],
									},
								},
								createdAt: { type: 'string' },
								createdBy: { type: 'string' },
								modifiedAt: { type: 'string' },
								modifiedBy: { type: 'string' },
								namespace: { type: 'string' },
								wabaAccountId: { type: 'string' },
								phoneNumber: { type: 'string' },
								partnerId: { type: 'string' },
								externalId: { type: 'string' },
								updatedExternal: { type: 'string' },
								rejectedReason: {
									type: ['string', 'null'],
								},
							},
						},
					},
				},
			},
		},
	},
};

export const GETOutboundProviderMetadataSchema = ajv.compile<{ metadata: IOutboundProviderMetadata }>(OutboundProviderMetadataSchema);
