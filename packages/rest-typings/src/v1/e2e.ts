import type { IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type E2eSetUserPublicAndPrivateKeysProps = {
	public_key: string;
	private_key: string;
};

const E2eSetUserPublicAndPrivateKeysSchema = {
	type: 'object',
	properties: {
		public_key: {
			type: 'string',
		},
		private_key: {
			type: 'string',
		},
	},
	required: ['public_key', 'private_key'],
	additionalProperties: false,
};

export const isE2eSetUserPublicAndPrivateKeysProps = ajv.compile<E2eSetUserPublicAndPrivateKeysProps>(E2eSetUserPublicAndPrivateKeysSchema);

type E2eGetUsersOfRoomWithoutKeyProps = { rid: string };

const E2eGetUsersOfRoomWithoutKeySchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isE2eGetUsersOfRoomWithoutKeyProps = ajv.compile<E2eGetUsersOfRoomWithoutKeyProps>(E2eGetUsersOfRoomWithoutKeySchema);

type E2eUpdateGroupKeyProps = {
	uid: string;
	rid: string;
	key: string;
};

const E2eUpdateGroupKeySchema = {
	type: 'object',
	properties: {
		uid: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		key: {
			type: 'string',
		},
	},
	required: ['uid', 'rid', 'key'],
	additionalProperties: false,
};

export const isE2eUpdateGroupKeyProps = ajv.compile<E2eUpdateGroupKeyProps>(E2eUpdateGroupKeySchema);

type E2eSetRoomKeyIdProps = {
	rid: string;
	keyID: string;
};

const E2eSetRoomKeyIdSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		keyID: {
			type: 'string',
		},
	},
	required: ['rid', 'keyID'],
	additionalProperties: false,
};

export const isE2eSetRoomKeyIdProps = ajv.compile<E2eSetRoomKeyIdProps>(E2eSetRoomKeyIdSchema);

export type E2eEndpoints = {
	'/v1/e2e.setUserPublicAndPrivateKeys': {
		POST: (params: E2eSetUserPublicAndPrivateKeysProps) => void;
	};
	'/v1/e2e.getUsersOfRoomWithoutKey': {
		GET: (params: E2eGetUsersOfRoomWithoutKeyProps) => {
			users: Pick<IUser, '_id' | 'e2e'>[];
		};
	};
	'/v1/e2e.updateGroupKey': {
		POST: (params: E2eUpdateGroupKeyProps) => void;
	};
	'/v1/e2e.setRoomKeyID': {
		POST: (params: E2eSetRoomKeyIdProps) => void;
	};
	'/v1/e2e.fetchMyKeys': {
		GET: () => { public_key: string; private_key: string };
	};
};
