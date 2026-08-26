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

export type InvitesEndpoints = {
	// Type-migration pending: the ExtractRoutesFromAPI emit for this route is
	// weaker than this declaration (see the Omit in the meteor augmentation).
	'/v1/findOrCreateInvite': {
		POST: (params: FindOrCreateInviteParams) => IInvite;
	};
};
