import type { IInvite, IRoom } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from './Ajv';

type UseInviteTokenProps = {
	token: string;
};

const UseInviteTokenPropsSchema: JSONSchemaType<UseInviteTokenProps> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isUseInviteTokenProps = ajv.compile<UseInviteTokenProps>(UseInviteTokenPropsSchema);

type ValidateInviteTokenProps = {
	token: string;
};

const ValidateInviteTokenPropsSchema: JSONSchemaType<ValidateInviteTokenProps> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isValidateInviteTokenProps = ajv.compile<ValidateInviteTokenProps>(ValidateInviteTokenPropsSchema);

type FindOrCreateInviteParams = { rid: IRoom['_id']; days: number; maxUses: number };

const FindOrCreateInviteParamsSchema: JSONSchemaType<FindOrCreateInviteParams> = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		days: {
			type: 'integer',
		},
		maxUses: {
			type: 'integer',
		},
	},
	required: ['rid', 'days', 'maxUses'],
	additionalProperties: false,
};

export const isFindOrCreateInviteParams = ajv.compile<FindOrCreateInviteParams>(FindOrCreateInviteParamsSchema);

type SendInvitationEmailParams = {
	emails: string[];
};

const SendInvitationEmailParamsSchema: JSONSchemaType<SendInvitationEmailParams> = {
	type: 'object',
	properties: {
		emails: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	required: ['emails'],
	additionalProperties: false,
};

export const isSendInvitationEmailParams = ajv.compile<SendInvitationEmailParams>(SendInvitationEmailParamsSchema);

// Public mirror of the implementation-derived routes (apps/meteor/server/api/v1/invites.ts,
// `ExtractRoutesFromAPI<typeof invites>`). Kept identical so the two declarations merge without
// TS2320, and so SDK/external consumers that don't compile apps/meteor keep these routes.
export type InvitesEndpoints = {
	'/v1/listInvites': {
		GET: (params?: never) => IInvite[];
	};
	'/v1/findOrCreateInvite': {
		POST: (params: FindOrCreateInviteParams) => IInvite;
	};
	'/v1/removeInvite/:_id': {
		DELETE: (params?: never) => boolean;
	};
	'/v1/useInviteToken': {
		POST: (params: UseInviteTokenProps) => {
			room: { rid: IRoom['_id']; prid: IRoom['prid']; fname: IRoom['fname']; name: IRoom['name']; t: IRoom['t'] };
			success: boolean;
		};
	};
	'/v1/validateInviteToken': {
		POST: (params: ValidateInviteTokenProps) => { valid: boolean };
	};
	'/v1/sendInvitationEmail': {
		POST: (params: SendInvitationEmailParams) => { success: boolean };
	};
};
