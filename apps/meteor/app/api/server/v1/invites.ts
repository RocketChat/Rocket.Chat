import type { IInvite } from '@rocket.chat/core-typings';
import {
	isFindOrCreateInviteParams,
	isUseInviteTokenProps,
	isValidateInviteTokenProps,
	isSendInvitationEmailParams,
} from '@rocket.chat/rest-typings';

import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { removeInvite } from '../../../invites/server/functions/removeInvite';
import { sendInvitationEmail } from '../../../invites/server/functions/sendInvitationEmail';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';
import { API } from '../api';

API.v1.addRoute(
	'listInvites',
	{
		authRequired: true,
	},
	{
		async get() {
			const result = await listInvites(this.userId);
			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'findOrCreateInvite',
	{
		authRequired: true,
		validateParams: isFindOrCreateInviteParams,
	},
	{
		async post() {
			const { rid, days, maxUses } = this.bodyParams;

			return API.v1.success((await findOrCreateInvite(this.userId, { rid, days, maxUses })) as IInvite);
		},
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
