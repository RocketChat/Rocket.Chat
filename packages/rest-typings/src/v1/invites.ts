import type { IInvite, IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type v1UseInviteTokenProps = {
	token: string;
};

const v1UseInviteTokenPropsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isV1UseInviteTokenProps = ajv.compile<v1UseInviteTokenProps>(v1UseInviteTokenPropsSchema);

type v1ValidateInviteTokenProps = {
	token: string;
};

const v1ValidateInviteTokenPropsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isV1ValidateInviteTokenProps = ajv.compile<v1ValidateInviteTokenProps>(v1ValidateInviteTokenPropsSchema);

export type InvitesEndpoints = {
	'listInvites': {
		GET: () => Array<IInvite>;
	};
	'removeInvite/:_id': {
		DELETE: () => void;
	};
	'/v1/useInviteToken': {
		POST: (params: v1UseInviteTokenProps) => {
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
		POST: (params: v1ValidateInviteTokenProps) => { valid: boolean };
	};
};
