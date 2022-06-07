import type { IInvite, IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type UseInviteTokenProps = {
	token: string;
};

const UseInviteTokenPropsSchema = {
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

const ValidateInviteTokenPropsSchema = {
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

const FindOrCreateInviteParamsSchema = {
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

export type InvitesEndpoints = {
	'listInvites': {
		GET: () => Array<IInvite>;
	};
	'removeInvite/:_id': {
		DELETE: () => boolean;
	};
	'useInviteToken': {
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
	'validateInviteToken': {
		POST: (params: ValidateInviteTokenProps) => { valid: boolean };
	};
	'findOrCreateInvite': {
		POST: (params: FindOrCreateInviteParams) => IInvite;
	};
};
