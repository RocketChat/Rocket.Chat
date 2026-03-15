import type { IInvite } from '@rocket.chat/core-typings';
import {
	ajv,
	isFindOrCreateInviteParams,
	isUseInviteTokenProps,
	isValidateInviteTokenProps,
	isSendInvitationEmailParams,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { removeInvite } from '../../../invites/server/functions/removeInvite';
import { sendInvitationEmail } from '../../../invites/server/functions/sendInvitationEmail';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const invites = API.v1
	.get(
		'listInvites',
		{
			authRequired: true,
			response: {
				200: ajv.compile<IInvite[]>({
					additionalProperties: false,
					type: 'array',
					items: {
						$ref: '#/components/schemas/IInvite',
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
							type: 'string',
						},
						_updatedAt: {
							type: 'string',
						},
						expires: {
							type: 'string',
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
	)
	.delete(
		'removeInvite/:_id',
		{
			authRequired: true,
			response: {
				200: ajv.compile({
					type: 'boolean',
					enum: [true],
				}),
				400: validateBadRequestErrorResponse,
				401: ajv.compile({
					type: 'object',
					properties: { error: { type: 'string' }, success: { type: 'boolean', enum: [false] } },
					required: ['success', 'error'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const { _id } = this.urlParams;

			return API.v1.success(await removeInvite(this.userId, { _id }));
		},
	)
	.post(
		'useInviteToken',
		{
			authRequired: true,
			body: isUseInviteTokenProps,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						room: {
							type: 'object',
							properties: {
								rid: { type: 'string' },
								prid: { type: 'string', nullable: true },
								fname: { type: 'string', nullable: true },
								name: { type: 'string', nullable: true },
								t: { type: 'string' },
							},
							required: ['rid', 't'],
							additionalProperties: false,
						},
						success: { type: 'boolean', enum: [true] },
					},
					required: ['room', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: ajv.compile({
					type: 'object',
					properties: { error: { type: 'string' }, success: { type: 'boolean', enum: [false] } },
					required: ['success', 'error'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const { token } = this.bodyParams;
			return API.v1.success(await useInviteToken(this.userId, token));
		},
	)
	.post(
		'validateInviteToken',
		{
			authRequired: false,
			body: isValidateInviteTokenProps,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						valid: { type: 'boolean' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['valid', 'success'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const { token } = this.bodyParams;
			try {
				return API.v1.success({ valid: Boolean(await validateInviteToken(token)) });
			} catch (_) {
				return API.v1.success({ valid: false });
			}
		},
	)
	.post(
		'sendInvitationEmail',
		{
			authRequired: true,
			body: isSendInvitationEmailParams,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: { success: { type: 'boolean' } },
					required: ['success'],
					additionalProperties: false,
				}),
				400: ajv.compile({
					type: 'object',
					properties: { error: { type: 'string' }, success: { type: 'boolean', enum: [false] } },
					required: ['success', 'error'],
					additionalProperties: false,
				}),
				401: ajv.compile({
					type: 'object',
					properties: { error: { type: 'string' }, success: { type: 'boolean', enum: [false] } },
					required: ['success', 'error'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const { emails } = this.bodyParams;
			try {
				return API.v1.success({ success: Boolean(await sendInvitationEmail(this.userId, emails)) });
			} catch (e: unknown) {
				return API.v1.failure({ error: e instanceof Error ? e.message : String(e) });
			}
		},
	);

type InvitesEndpoints = ExtractRoutesFromAPI<typeof invites>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends InvitesEndpoints {}
}
