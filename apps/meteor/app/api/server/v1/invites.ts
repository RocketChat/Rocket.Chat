import type { IInvite } from '@rocket.chat/core-typings';
import {
	isUseInviteTokenProps,
	isValidateInviteTokenProps,
	isSendInvitationEmailParams,
	UnauthorizedErrorResponseSchema,
	BadRequestErrorResponseSchema,
	GETListInvitesResponseSchema,
	POSTFindOrCreateInviteBodySchema,
	POSTFindOrCreateInviteResponseSchema,
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
				200: GETListInvitesResponseSchema,
				401: UnauthorizedErrorResponseSchema,
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
			body: POSTFindOrCreateInviteBodySchema,
			response: {
				200: POSTFindOrCreateInviteResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
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

type InvitesEndpoints = ExtractRoutesFromAPI<typeof invites>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends InvitesEndpoints {}
}
