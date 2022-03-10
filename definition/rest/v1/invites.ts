import Ajv, { JSONSchemaType } from 'ajv';

import type { IInvite } from '../../IInvite';
import type { IRoom } from '../../IRoom';

const ajv = new Ajv();

type v1UseInviteTokenProps = {
	token: string;
};

const v1UseInviteTokenPropsSchema: JSONSchemaType<v1UseInviteTokenProps> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isV1UseInviteToken = ajv.compile(v1UseInviteTokenPropsSchema);

type v1ValidateInviteTokenProps = {
	token: string;
};

const v1ValidateInviteTokenPropsSchema: JSONSchemaType<v1ValidateInviteTokenProps> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isV1ValidateInviteToken = ajv.compile(v1ValidateInviteTokenPropsSchema);

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
