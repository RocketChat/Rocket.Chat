import type { IInvite } from '@rocket.chat/core-typings';
import {
	isFindOrCreateInviteParams,
	isUseInviteTokenProps,
	isValidateInviteTokenProps,
	isSendInvitationEmailParams,
} from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { removeInvite } from '../../../invites/server/functions/removeInvite';
import { sendInvitationEmail } from '../../../invites/server/functions/sendInvitationEmail';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';
import { API } from '../api';

API.v1
	.get(
		'listInvites',
		{
			authRequired: true,
			response: {
				200: ajv.compile({
					additionalProperties: false,
					type: 'array',
					items: {
						type: 'object',
						properties: {
							_id: {
								type: 'string',
							},
							days: {
								type: 'number',
							},
							rid: {
								type: 'string',
							},
							userId: {
								type: 'string',
							},
							createdAt: {
								type: 'object',
							},
							expires: {
								type: 'object',
								nullable: true,
							},
							url: {
								type: 'string',
							},
							_updatedAt: {
								type: 'object',
							},
							maxUses: {
								type: 'number',
							},
							uses: {
								type: 'number',
							},
						},
						required: ['_id', 'days', 'rid', 'userId', 'createdAt', 'url', '_updatedAt', 'maxUses', 'uses'],
					},
				}),
				401: ajv.compile({
					additionalProperties: false,
					type: 'object',
					properties: {
						error: {
							type: 'string',
						},
						status: {
							type: 'string',
							nullable: true,
						},
						message: {
							type: 'string',
							nullable: true,
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'error'],
				}),
			},
		},

		async function () {
			const result = await listInvites(this.userId);
			return API.v1.success(result);
		},
	)
	.post(
		'findOrCreateInvite',
		{
			authRequired: true,
			body: isFindOrCreateInviteParams,
			response: {
				200: ajv.compile({
					additionalProperties: false,
					type: 'object',
					properties: {
						_id: {
							type: 'string',
						},
						rid: {
							type: 'string',
						},
						userId: {
							type: 'string',
						},
						createdAt: {
							type: 'object',
						},
						_updatedAt: {
							type: 'object',
						},
						expires: {
							type: 'object',
							nullable: true,
						},
						url: {
							type: 'string',
						},
						maxUses: {
							type: 'number',
						},
						days: {
							type: 'number',
						},
						uses: {
							type: 'number',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['_id', 'rid', 'createdAt', 'maxUses', 'uses', 'userId', '_updatedAt', 'days', 'success'],
				}),
				400: ajv.compile({
					additionalProperties: false,
					type: 'object',
					properties: {
						error: {
							type: 'string',
						},
						stack: {
							type: 'string',
							nullable: true,
						},
						errorType: {
							type: 'string',
						},
						details: {
							type: 'object',
							nullable: true,
							properties: {
								rid: {
									type: 'string',
								},
								method: {
									type: 'string',
								},
							},
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'errorType', 'error'],
				}),
				401: ajv.compile({
					additionalProperties: false,
					type: 'object',
					properties: {
						error: {
							type: 'string',
						},
						status: {
							type: 'string',
							nullable: true,
						},
						message: {
							type: 'string',
							nullable: true,
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'error'],
				}),
			},
		},

		async function () {
			const { rid, days, maxUses } = this.bodyParams;

			return API.v1.success((await findOrCreateInvite(this.userId, { rid, days, maxUses })) as IInvite);
		},
	);

API.v1.addRoute(
	'removeInvite/:_id',
	{ authRequired: true },
	{
		async delete() {
			const { _id } = this.urlParams;

			return API.v1.success(await removeInvite(this.userId, { _id }));
		},
	},
);

API.v1.addRoute(
	'useInviteToken',
	{
		authRequired: true,
		validateParams: isUseInviteTokenProps,
	},
	{
		async post() {
			const { token } = this.bodyParams;
			// eslint-disable-next-line react-hooks/rules-of-hooks
			return API.v1.success(await useInviteToken(this.userId, token));
		},
	},
);

API.v1.addRoute(
	'validateInviteToken',
	{
		authRequired: false,
		validateParams: isValidateInviteTokenProps,
	},
	{
		async post() {
			const { token } = this.bodyParams;
			try {
				return API.v1.success({ valid: Boolean(await validateInviteToken(token)) });
			} catch (_) {
				return API.v1.success({ valid: false });
			}
		},
	},
);

API.v1.addRoute(
	'sendInvitationEmail',
	{
		authRequired: true,
		validateParams: isSendInvitationEmailParams,
	},
	{
		async post() {
			const { emails } = this.bodyParams;
			try {
				return API.v1.success({ success: Boolean(await sendInvitationEmail(this.userId, emails)) });
			} catch (e: any) {
				return API.v1.failure({ error: e.message });
			}
		},
	},
);
