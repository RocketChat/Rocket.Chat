/* eslint-disable react-hooks/rules-of-hooks */
import type { IInvite } from '@rocket.chat/core-typings';
import { isFindOrCreateInviteParams, isUseInviteTokenProps, isValidateInviteTokenProps } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { removeInvite } from '../../../invites/server/functions/removeInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';

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
