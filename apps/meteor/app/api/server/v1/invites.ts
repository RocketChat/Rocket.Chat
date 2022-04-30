import { API } from '../api';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { removeInvite } from '../../../invites/server/functions/removeInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';

API.v1.addRoute(
	'listInvites',
	{ authRequired: true },
	{
		async get() {
			const result = await listInvites(this.userId);
			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'findOrCreateInvite',
	{ authRequired: true },
	{
		async post() {
			const { rid, days, maxUses } = this.bodyParams;
			const result = await findOrCreateInvite(this.userId, { rid, days, maxUses });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'removeInvite/:_id',
	{ authRequired: true },
	{
		async delete() {
			const { _id } = this.urlParams;
			const result = await removeInvite(this.userId, { _id });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'useInviteToken',
	{ authRequired: true },
	{
		async post() {
			const { token } = this.bodyParams;
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const result = await useInviteToken(this.userId, token);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'validateInviteToken',
	{ authRequired: false },
	{
		async post() {
			const { token } = this.bodyParams;

			let valid = true;
			try {
				await validateInviteToken(token);
			} catch (e) {
				valid = false;
			}

			return API.v1.success({ valid });
		},
	},
);
