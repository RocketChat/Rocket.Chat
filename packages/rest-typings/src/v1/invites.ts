import type { IInvite, IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

type ListInvites = { rid: string };

type FindOrCreateInvite = { rid: IInvite['rid']; days: IInvite['days']; maxUses: IInvite['maxUses'] };

type UseInviteToken = { token: string };

type ValidateInviteToken = { token: string };

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

export const isListInvitesProps = ajv.compile<ListInvites>(ListInvitesSchema);

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

export const isFindOrCreateInviteProps = ajv.compile<FindOrCreateInvite>(FindOrCreateInviteSchema);

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

export const isUseInviteTokenProps = ajv.compile<UseInviteToken>(UseInviteTokenSchema);

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

export const isValidateInviteTokenProps = ajv.compile<ValidateInviteToken>(ValidateInviteTokenSchema);

export type InvitesEndpoints = {
	'listInvites': {
		GET: (params: ListInvites) => IInvite[];
	};

	'findOrCreateInvite': {
		POST: (params: FindOrCreateInvite) => IInvite | false;
	};

	'removeInvite/:_id': {
		DELETE: () => boolean;
	};

	'useInviteToken': {
		POST: (params: UseInviteToken) => {
			room: {
				rid: IRoom['_id'];
				prid: IRoom['prid'];
				fname: IRoom['fname'];
				name: IRoom['name'];
				t: IRoom['t'];
			};
		};
	};

	'validateInviteToken': {
		POST: (params: ValidateInviteToken) => {
			valid: boolean;
		};
	};
};
