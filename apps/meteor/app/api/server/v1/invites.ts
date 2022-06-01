import { IInvite } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import { API } from '../api';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { removeInvite } from '../../../invites/server/functions/removeInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';

/* import {
	isListInvitesProps,
	isFindOrCreateInviteProps,
	isUseInviteTokenProps,
	isValidateInviteTokenProps,
} from '@rocket.chat/rest-typings'; */

const ajv = new Ajv({
	coerceTypes: true,
});

const ListInvitesSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isListInvitesProps = ajv.compile(ListInvitesSchema);

const FindOrCreateInviteSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		days: {
			type: 'number',
		},
		maxUses: {
			type: 'number',
		},
	},
	required: ['rid', 'days', 'maxUses'],
	additionalProperties: false,
};

export const isFindOrCreateInviteProps = ajv.compile(FindOrCreateInviteSchema);

const UseInviteTokenSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isUseInviteTokenProps = ajv.compile(UseInviteTokenSchema);

const ValidateInviteTokenSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isValidateInviteTokenProps = ajv.compile(ValidateInviteTokenSchema);

API.v1.addRoute(
	'listInvites',
	{
		authRequired: true,
		validateParams: isListInvitesProps,
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
		validateParams: isFindOrCreateInviteProps,
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
				return API.v1.success({ valid: await validateInviteToken(token) });
			} catch (_) {
				return API.v1.success({ valid: false });
			}
		},
	},
);
