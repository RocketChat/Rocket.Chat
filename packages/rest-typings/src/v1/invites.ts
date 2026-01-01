import { IInviteSchema, IRoomSchema, type IInvite, type IRoom } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';

export const GETListInvitesResponseSchema = z.array(IInviteSchema);

export const POSTFindOrCreateInviteBodySchema = z.object({
	rid: IRoomSchema.shape._id,
	days: z.number(),
	maxUses: z.number(),
});

export const POSTFindOrCreateInviteResponseSchema = SuccessResponseSchema.and(IInviteSchema);

const ajv = new Ajv({
	coerceTypes: true,
});

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
	'/v1/removeInvite/:_id': {
		DELETE: () => boolean;
	};
	'/v1/useInviteToken': {
		POST: (params: UseInviteTokenProps) => {
			room: {
				rid: IRoom['_id'];
				prid: IRoom['prid'];
				fname: IRoom['fname'];
				name: IRoom['name'];
				t: IRoom['t'];
			};
		};
	};
	'/v1/validateInviteToken': {
		POST: (params: ValidateInviteTokenProps) => { valid: boolean };
	};
	'/v1/findOrCreateInvite': {
		POST: (params: FindOrCreateInviteParams) => IInvite;
	};
	'/v1/sendInvitationEmail': {
		POST: (params: SendInvitationEmailParams) => { success: boolean };
	};
};
